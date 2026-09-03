import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agenda DRX - Bruker D2 | UFN",
  description: "Sistema de agendamento online do difratômetro de raios-X Bruker D2 Phaser da UFN.",
  icons: {
    icon: "/bruker-d2.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative bg-slate-50 text-slate-900">
        {/* Marca d'água elegante no fundo do sistema */}
        <div
          className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.07] select-none overflow-hidden"
          aria-hidden="true"
        >
          <img
            src="/bruker-d2.png"
            alt="Marca d'água Bruker D2"
            className="w-auto h-[70vh] max-w-[90vw] object-contain filter contrast-125"
          />
        </div>

        {/* Conteúdo da aplicação sobreposto com z-10 */}
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
