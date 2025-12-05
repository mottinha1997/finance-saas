/**
 * ====================================================================
 * SIDEBAR - Menu Lateral de Navegação
 * ====================================================================
 * Componente de barra lateral que aparece em todas as páginas do dashboard
 * 
 * Contém:
 * - Logo/título da aplicação
 * - Links de navegação (Dashboard, Settings)
 * - Informações do usuário e botão de logout (via Clerk)
 */

import Link from "next/link";
import { LayoutDashboard, Settings, PieChart } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export function Sidebar() {
  return (
    <div className="flex h-full flex-col border-r bg-muted/10">
      {/* ============================================================
          CABEÇALHO - Logo e Título
          ============================================================ */}
      <div className="flex h-14 items-center border-b px-6">
        <PieChart className="mr-2 h-6 w-6 text-emerald-600" />
        <span className="font-bold text-lg">Finance SaaS</span>
      </div>

      {/* ============================================================
          NAVEGAÇÃO PRINCIPAL
          Links para páginas do dashboard
          ============================================================ */}
      <nav className="flex-1 space-y-1 p-4">
        {/* Link: Dashboard Principal */}
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition-all"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        {/* Link: Configurações */}
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition-all"
        >
          <Settings className="h-4 w-4" />
          Configurações
        </Link>
      </nav>

      {/* ============================================================
          RODAPÉ - Informações do Usuário
          Componente Clerk para avatar, nome e logout
          ============================================================ */}
      <div className="border-t p-4 flex items-center gap-4">
        {/* 
          UserButton do Clerk:
          - Mostra avatar do usuário
          - Menu dropdown com logout e manage account
          - showName: exibe nome do usuário ao lado do avatar
        */}
        <UserButton showName />

        {/* Badge de plano */}
        <div className="text-xs text-muted-foreground">
          <p>Conta Gratuita</p>
        </div>
      </div>
    </div>
  );
}