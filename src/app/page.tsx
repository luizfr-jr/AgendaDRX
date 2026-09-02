"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Clock,
  User,
  Building,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CalendarCheck
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

interface Agendamento {
  id?: string;
  data: string; // "yyyy-MM-dd"
  horaInicio: string; // "HH:mm"
  horaFim: string; // "HH:mm"
  nome: string;
  orientador: string;
  instituicao: string;
}

export default function Home() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Dados do formulário
  const [formData, setFormData] = useState({
    nome: "",
    orientador: "",
    instituicao: "",
    horaInicio: "08:00",
    horaFim: "09:00",
  });

  // Gerar dias da semana (Segunda a Sexta)
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Começa na segunda
  const weekDays = Array.from({ length: 5 }).map((_, i) => addDays(startDate, i));

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

  // Escutar agendamentos do dia selecionado em tempo real no Firestore
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "agendamentos"),
      where("data", "==", selectedDateStr)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs: Agendamento[] = [];
        snapshot.forEach((doc) => {
          docs.push({ id: doc.id, ...(doc.data() as Omit<Agendamento, "id">) });
        });

        // Ordena por horário de início
        docs.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
        setAgendamentos(docs);
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao carregar agendamentos:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedDateStr]);

  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));

  const handleOpenModal = (prefillStart?: string) => {
    setErrorMessage("");
    setSuccessMessage("");
    if (prefillStart) {
      setFormData((prev) => ({
        ...prev,
        horaInicio: prefillStart,
        horaFim: prefillStart < "21:00" ? `${(parseInt(prefillStart.slice(0, 2)) + 1).toString().padStart(2, "0")}:00` : "22:00"
      }));
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setErrorMessage("");
  };

  // Calcular intervalos livres entre 08:00 e 22:00
  const getIntervalosLivres = () => {
    const intervalos: { inicio: string; fim: string }[] = [];
    let cursor = "08:00";

    for (const ag of agendamentos) {
      if (ag.horaInicio > cursor) {
        intervalos.push({ inicio: cursor, fim: ag.horaInicio });
      }
      if (ag.horaFim > cursor) {
        cursor = ag.horaFim;
      }
    }

    if (cursor < "22:00") {
      intervalos.push({ inicio: cursor, fim: "22:00" });
    }

    return intervalos;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const { horaInicio, horaFim, nome, orientador, instituicao } = formData;

    // Validações básicas
    if (horaInicio >= horaFim) {
      setErrorMessage("O horário de início deve ser menor que o horário de término.");
      return;
    }

    if (horaInicio < "08:00" || horaFim > "22:00") {
      setErrorMessage("O horário deve estar entre 08:00 e 22:00.");
      return;
    }

    // Verificar choque / sobreposição de horários
    // Choque ocorre se: (novoInicio < itemFim) && (novoFim > itemInicio)
    const conflito = agendamentos.find(
      (ag) => horaInicio < ag.horaFim && horaFim > ag.horaInicio
    );

    if (conflito) {
      setErrorMessage(
        `Horário indisponível! Já existe agendamento de ${conflito.horaInicio} às ${conflito.horaFim} (${conflito.nome}).`
      );
      return;
    }

    try {
      setSubmitting(true);
      await addDoc(collection(db, "agendamentos"), {
        data: selectedDateStr,
        horaInicio,
        horaFim,
        nome: nome.trim(),
        orientador: orientador.trim(),
        instituicao: instituicao.trim(),
        criadoEm: serverTimestamp(),
      });

      setSubmitting(false);
      setIsModalOpen(false);
      setSuccessMessage("Agendamento confirmado com sucesso!");

      // Limpar campos de texto
      setFormData({
        nome: "",
        orientador: "",
        instituicao: "",
        horaInicio: "08:00",
        horaFim: "09:00",
      });

      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      setErrorMessage("Ocorreu um erro ao salvar o agendamento. Verifique se as regras do Firestore estão ativas.");
    }
  };

  const intervalosLivres = getIntervalosLivres();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header Fixo Mobile-friendly */}
      <header className="bg-blue-600 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-700/80 rounded-lg">
              <CalendarCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Agenda DRX</h1>
              <p className="text-xs text-blue-100">Bruker D2 • UFN</p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-white text-blue-700 hover:bg-blue-50 text-sm font-semibold px-3.5 py-1.5 rounded-lg shadow transition active:scale-95 flex items-center gap-1.5"
          >
            <span>+</span> Agendar
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Notificação de Sucesso */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-xl flex items-center gap-2.5 text-sm shadow-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Card Seletor de Semana */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4">
          <div className="flex justify-between items-center mb-3">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-600"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-semibold text-slate-700 capitalize tracking-wide">
              {format(startDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
            <button
              onClick={handleNextWeek}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-600"
              aria-label="Próxima semana"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dias da Semana (Seg a Sex) */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {weekDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-blue-50/50"
                  }`}
                >
                  <span className={`text-[11px] font-medium uppercase ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                    {format(day, "EEE", { locale: ptBR })}
                  </span>
                  <span className="text-base font-bold mt-0.5">{format(day, "dd")}</span>
                  {isToday && (
                    <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? "bg-white" : "bg-blue-600"}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cabeçalho do Dia */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-base font-bold text-slate-800 capitalize">
              {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h3>
            <p className="text-xs text-slate-500">Funcionamento: 08:00 às 22:00</p>
          </div>
        </div>

        {/* Conteúdo de Agendamentos e Horários Livres */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs">Carregando disponibilidade...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Lista de Horários Ocupados */}
            {agendamentos.length > 0 ? (
              <div className="space-y-2.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
                  Horários Reservados ({agendamentos.length})
                </div>
                {agendamentos.map((ag) => (
                  <div
                    key={ag.id}
                    className="bg-white rounded-xl p-3.5 border-l-4 border-l-amber-500 border border-slate-200 shadow-sm space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-100/80 px-2.5 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        {ag.horaInicio} às {ag.horaFim}
                      </span>
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded">
                        Ocupado
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800">{ag.nome}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Orientador: <strong>{ag.orientador}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:col-span-2">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{ag.instituicao}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 text-center">
                <p className="text-emerald-800 text-sm font-medium">
                  🎉 Nenhum agendamento para este dia!
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  O equipamento está disponível das 08:00 às 22:00.
                </p>
              </div>
            )}

            {/* Lista de Janelas Livres para Agendamento Rápido */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
                Horários Livres para Agendar
              </div>
              <div className="grid grid-cols-1 gap-2">
                {intervalosLivres.map((inter, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl p-3 border border-dashed border-emerald-300 flex items-center justify-between hover:bg-emerald-50/40 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-sm font-semibold text-slate-700">
                        {inter.inicio} às {inter.fim}
                      </span>
                      <span className="text-[11px] text-emerald-700 font-medium bg-emerald-100 px-2 py-0.5 rounded-full">
                        Livre
                      </span>
                    </div>
                    <button
                      onClick={() => handleOpenModal(inter.inicio)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95"
                    >
                      Reservar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Agendamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-base font-bold text-slate-800">Novo Agendamento DRX</h2>
                <p className="text-xs text-slate-500 capitalize">
                  {format(selectedDate, "EEEE, dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full text-slate-400 hover:bg-slate-200 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Horários */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Início
                  </label>
                  <input
                    type="time"
                    required
                    min="08:00"
                    max="21:59"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Fim
                  </label>
                  <input
                    type="time"
                    required
                    min={formData.horaInicio}
                    max="22:00"
                    value={formData.horaFim}
                    onChange={(e) => setFormData({ ...formData, horaFim: e.target.value })}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Nome do Operador */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Nome do Operador
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              {/* Orientador */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Orientador
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Prof. Dr. Carlos Souza"
                  value={formData.orientador}
                  onChange={(e) => setFormData({ ...formData, orientador: e.target.value })}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              {/* Universidade / Empresa */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" /> Universidade / Empresa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: UFN, UFSM, Laboratório X"
                  value={formData.instituicao}
                  onChange={(e) => setFormData({ ...formData, instituicao: e.target.value })}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Confirmar e Reservar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
