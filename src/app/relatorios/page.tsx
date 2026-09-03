"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Clock,
  Download,
  Mail,
  Users,
  Building,
  CheckCircle2,
  Copy,
  Loader2,
  FileSpreadsheet
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

interface Agendamento {
  id: string;
  data: string; // "yyyy-MM-dd"
  horaInicio: string; // "HH:mm"
  horaFim: string; // "HH:mm"
  nome: string;
  orientador: string;
  instituicao: string;
}

// Converte "HH:mm" para minutos desde meia-noite
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// Calcula duração em horas (número decimal)
function calcDurationHours(start: string, end: string): number {
  const diff = timeToMinutes(end) - timeToMinutes(start);
  return Math.max(0, diff / 60);
}

export default function RelatoriosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM")
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const q = query(collection(db, "agendamentos"), orderBy("data", "desc"));
        const snapshot = await getDocs(q);
        const list: Agendamento[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Agendamento, "id">) });
        });
        setAgendamentos(list);
      } catch (err) {
        console.error("Erro ao carregar agendamentos:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtrar agendamentos pelo mês selecionado (ou todos)
  const filtered = agendamentos.filter((ag) => {
    if (selectedMonth === "todos") return true;
    return ag.data && ag.data.startsWith(selectedMonth);
  });

  // Cálculos de Totais
  const totalHoras = filtered.reduce((acc, ag) => acc + calcDurationHours(ag.horaInicio, ag.horaFim), 0);
  const totalEnsaios = filtered.length;

  // Agrupamento por Orientador
  const orientadoresMap = new Map<string, { count: number; horas: number }>();
  filtered.forEach((ag) => {
    const key = ag.orientador || "Não informado";
    const current = orientadoresMap.get(key) || { count: 0, horas: 0 };
    orientadoresMap.set(key, {
      count: current.count + 1,
      horas: current.horas + calcDurationHours(ag.horaInicio, ag.horaFim),
    });
  });
  const rankingOrientadores = Array.from(orientadoresMap.entries())
    .map(([nome, dados]) => ({ nome, ...dados }))
    .sort((a, b) => b.horas - a.horas);

  // Agrupamento por Universidade / Empresa
  const instituicoesMap = new Map<string, { count: number; horas: number }>();
  filtered.forEach((ag) => {
    const key = ag.instituicao || "Não informada";
    const current = instituicoesMap.get(key) || { count: 0, horas: 0 };
    instituicoesMap.set(key, {
      count: current.count + 1,
      horas: current.horas + calcDurationHours(ag.horaInicio, ag.horaFim),
    });
  });
  const rankingInstituicoes = Array.from(instituicoesMap.entries())
    .map(([nome, dados]) => ({ nome, ...dados }))
    .sort((a, b) => b.horas - a.horas);

  // Lista de meses únicos disponíveis
  const availableMonths = Array.from(
    new Set(agendamentos.map((ag) => ag.data?.slice(0, 7)).filter(Boolean))
  ).sort().reverse();

  // Texto formatado do relatório para envio ou cópia
  const getFormattedReportText = () => {
    const mesFormatado =
      selectedMonth === "todos"
        ? "Geral (Todo o histórico)"
        : format(parseISO(`${selectedMonth}-01`), "MMMM 'de' yyyy", { locale: ptBR });

    let txt = `RELATÓRIO DE UTILIZAÇÃO - DIFRAÇÃO DE RAIOS-X (BRUKER D2) - UFN\n`;
    txt += `Período: ${mesFormatado}\n`;
    txt += `Total de Ensaios / Agendamentos: ${totalEnsaios}\n`;
    txt += `Total de Horas Utilizadas: ${totalHoras.toFixed(1)} horas\n\n`;

    txt += `--- USO POR ORIENTADOR ---\n`;
    rankingOrientadores.forEach((o, i) => {
      txt += `${i + 1}. ${o.nome}: ${o.horas.toFixed(1)}h (${o.count} ensaios)\n`;
    });

    txt += `\n--- USO POR INSTITUIÇÃO / EMPRESA ---\n`;
    rankingInstituicoes.forEach((inst, i) => {
      txt += `${i + 1}. ${inst.nome}: ${inst.horas.toFixed(1)}h (${inst.count} ensaios)\n`;
    });

    txt += `\n--- LISTA DETALHADA DOS ENSAIOS ---\n`;
    filtered.forEach((ag) => {
      txt += `${ag.data} [${ag.horaInicio} - ${ag.horaFim}] - Op: ${ag.nome} | Orient: ${ag.orientador} | Inst: ${ag.instituicao}\n`;
    });

    return txt;
  };

  // Disparar e-mail para drx@ufn.edu.br
  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Relatório de Uso DRX Bruker D2 - ${selectedMonth}`);
    const body = encodeURIComponent(getFormattedReportText());
    window.location.href = `mailto:drx@ufn.edu.br?subject=${subject}&body=${body}`;
  };

  // Copiar relatório para a área de transferência
  const handleCopyReport = () => {
    navigator.clipboard.writeText(getFormattedReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Exportar arquivo CSV para Excel
  const handleExportCSV = () => {
    const headers = "Data;Hora Inicio;Hora Fim;Duracao (Horas);Operador;Orientador;Instituicao\n";
    const rows = filtered
      .map((ag) => {
        const dur = calcDurationHours(ag.horaInicio, ag.horaFim).toFixed(2).replace(".", ",");
        return `"${ag.data}";"${ag.horaInicio}";"${ag.horaFim}";"${dur}";"${ag.nome}";"${ag.orientador}";"${ag.instituicao}"`;
      })
      .join("\n");

    const csvContent = "\uFEFF" + headers + rows; // BOM para compatibilidade com Excel
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_drx_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold bg-blue-700/80 hover:bg-blue-800 px-3 py-1.5 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Agenda</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/30 shadow-xs shrink-0 bg-white/10 hidden sm:block">
              <img
                src="/bruker-d2.png"
                alt="Bruker D2 Phaser"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-right">
              <h1 className="text-sm font-bold leading-tight flex items-center gap-1.5 justify-end">
                <BarChart3 className="w-4 h-4" /> Relatórios de Uso
              </h1>
              <p className="text-[11px] text-blue-100">Destinatário: drx@ufn.edu.br</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-5 space-y-4">
        {/* Barra de Filtro e Ações */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-semibold text-slate-600 shrink-0">Filtrar Mês:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs font-medium rounded-xl p-2 focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-auto"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {format(parseISO(`${m}-01`), "MMMM 'de' yyyy", { locale: ptBR })}
                </option>
              ))}
              <option value="todos">Todo o histórico</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold px-3 py-2 rounded-xl transition shadow-sm"
              title="Baixar Planilha Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>
            <button
              onClick={handleSendEmail}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold px-3 py-2 rounded-xl transition shadow-sm"
              title="Enviar para drx@ufn.edu.br"
            >
              <Mail className="w-4 h-4" />
              <span>Enviar p/ E-mail</span>
            </button>
          </div>
        </div>

        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-3.5">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Horas Totais de Uso</p>
              <h3 className="text-2xl font-black text-slate-800">{totalHoras.toFixed(1)}h</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-3.5">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total de Ensaios</p>
              <h3 className="text-2xl font-black text-slate-800">{totalEnsaios}</h3>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs">Processando dados do laboratório...</span>
          </div>
        ) : (
          <>
            {/* Relatório por Orientador e por Instituição */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ranking por Orientador */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Users className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Uso por Orientador ({rankingOrientadores.length})
                  </h3>
                </div>
                {rankingOrientadores.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">Nenhum dado no período.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {rankingOrientadores.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-xl"
                      >
                        <span className="font-semibold text-slate-800 truncate max-w-[60%]">
                          {item.nome}
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-blue-700">{item.horas.toFixed(1)}h</span>
                          <span className="text-[10px] text-slate-400 ml-1.5">({item.count} ensaios)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ranking por Instituição */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Uso por Universidade / Empresa ({rankingInstituicoes.length})
                  </h3>
                </div>
                {rankingInstituicoes.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">Nenhum dado no período.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {rankingInstituicoes.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-xl"
                      >
                        <span className="font-semibold text-slate-800 truncate max-w-[60%]">
                          {item.nome}
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-emerald-700">{item.horas.toFixed(1)}h</span>
                          <span className="text-[10px] text-slate-400 ml-1.5">({item.count} ensaios)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Caixa de Texto do Relatório Pronto para Cópia */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Texto Formatado para Prestação de Contas
                </span>
                <button
                  onClick={handleCopyReport}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg transition"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copiado!" : "Copiar Texto"}</span>
                </button>
              </div>
              <textarea
                readOnly
                rows={7}
                value={getFormattedReportText()}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none resize-none"
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
