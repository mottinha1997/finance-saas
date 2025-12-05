import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { ptBR } from "@clerk/localizations";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Finance SaaS",
  description: "Gerencie suas finanças com inteligência.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Envolvemos todo o app no ClerkProvider para habilitar a autenticação
    <ClerkProvider localization={ptBR}>
      <html lang="pt-BR">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}