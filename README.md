# 📅 Agenda DRX - Bruker D2 (UFN)

Sistema web moderno e responsivo (otimizado para dispositivos móveis) para agendamento online do equipamento de Difração de Raios-X (**Bruker D2**).

## 🚀 Funcionalidades

- **Visualização Semanal & Diária**: Navegação simplificada entre semanas e seleção rápida de dias (Segunda a Sexta).
- **Detecção de Horários Livres**: Cálculo automático dos intervalos livres entre **08:00 e 22:00** para agendamento rápido com um clique.
- **Prevenção de Conflitos**: Bloqueio de sobreposição de horários (dois alunos não conseguem reservar horários coincidentes).
- **Formulário Completo**:
  - Nome do Operador
  - Orientador
  - Universidade / Empresa
  - Horário de Início e Término flexíveis
- **Banco de Dados em Tempo Real**: Conexão com o Firebase Firestore do Google.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS.
- **Ícones & Datas**: `lucide-react`, `date-fns`.
- **Backend / Database**: Firebase Firestore.

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

4. Abra [http://localhost:3000](http://localhost:3000) no navegador (ou pelo IP da máquina no celular).

## 🌐 Publicação (Deploy)

Você pode publicar este sistema gratuitamente na **Vercel** ou no **Firebase Hosting**:
- Na **Vercel**: Basta importar este repositório do GitHub e clicar em Deploy.
