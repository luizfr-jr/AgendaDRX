# 📅 Agenda DRX - Bruker D2 (UFN)

Sistema web moderno e responsivo (otimizado para dispositivos móveis) para agendamento online do equipamento de Difração de Raios-X (**Bruker D2 Phaser**).

🔗 **Acesso Online (Produção)**: [https://agendadrx-b24d5.web.app](https://agendadrx-b24d5.web.app)

> [!IMPORTANT]
> **Hospedagem e Banco de Dados (Firebase)**:
> O sistema está hospedado e conectado ao projeto Firebase vinculado exclusivamente à conta institucional Google: **`drx@ufn.edu.br`**.
> Todas as regras de segurança, banco de dados (Firestore) e hospedagem (Hosting) são administradas através desta conta.

---

## 🚀 Funcionalidades

- **Acesso Direto pelo Celular**: Interface limpa e pensada para uso ágil no smartphone.
- **Visualização Semanal & Diária**: Navegação simplificada entre semanas e seleção de dias úteis (Segunda a Sexta).
- **Detecção de Horários Livres**: Cálculo automático dos intervalos livres entre **08:00 e 22:00** para agendamento rápido.
- **Antecedência Mínima (10 minutos)**: Validação automática que impede agendamentos no passado ou com menos de 10 minutos de antecedência no mesmo dia.
- **Prevenção de Conflitos**: Bloqueio rigoroso de sobreposição de horários.
- **Cancelamento Seguro por PIN**:
  - O aluno define um PIN de 4 dígitos na reserva.
  - Cancelamento facilitado via PIN ou pela Senha Mestre de Coordenação (`drxufn2026`).
- **Formulário Completo**:
  - Nome do Operador
  - Orientador
  - Universidade / Empresa
  - Horário de Início e Término flexíveis
- **Módulo de Relatórios de Uso (`/relatorios`)**:
  - Total de horas e ensaios realizados no período.
  - Estatísticas de uso detalhadas por **Orientador** e por **Instituição**.
  - Envio direto do relatório consolidado para o e-mail: **`drx@ufn.edu.br`**.
  - Exportação de planilha Excel (CSV) para prestação de contas acadêmicas (FAPERGS, CNPq, CAPES).
- **Banco de Dados em Tempo Real**: Google Firebase Firestore com sincronização instantânea.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS.
- **Ícones & Datas**: `lucide-react`, `date-fns`.
- **Hospedagem & Backend**: Google Firebase Hosting & Firebase Firestore.

---

## 💻 Como Executar Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/luizfr-jr/AgendaDRX.git
   cd AgendaDRX
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Abra [http://localhost:3000](http://localhost:3000) no navegador.

---

## 🌐 Atualização e Deploy (Firebase Hosting)

Sempre que houver atualizações no código, o deploy é feito com os seguintes passos na pasta do projeto:

```bash
git pull
npm run build
firebase deploy --only hosting
```
