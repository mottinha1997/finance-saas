/**
 * ====================================================================
 * LAYOUT DO DASHBOARD
 * ====================================================================
 * Layout compartilhado por todas as páginas do dashboard
 * Implementa estrutura de duas colunas: Sidebar + Conteúdo
 * 
 * Páginas que usam este layout:
 * - / (dashboard principal)
 * - /settings (configurações)
 * 
 * Estrutura:
 * - Coluna 1: Sidebar fixa (escondida em mobile)
 * - Coluna 2: Conteúdo dinâmico (children)
 */

import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /**
     * Grid responsivo:
     * - Mobile (default): 1 coluna (sidebar escondida)
     * - Tablet (md): 2 colunas [220px sidebar | restante conteúdo]
     * - Desktop (lg): 2 colunas [280px sidebar | restante conteúdo]
     */
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* ============================================================
          COLUNA 1: SIDEBAR
          Fixa e sempre visível exceto em mobile
          ============================================================ */}
      <div className="hidden border-r bg-muted/40 md:block">
        <Sidebar />
      </div>

      {/* ============================================================
          COLUNA 2: CONTEÚDO PRINCIPAL
          Renderiza as páginas filhas (Dashboard, Settings, etc)
          ============================================================ */}
      <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {/* 
            children = Conteúdo da página atual
            Ex: page.tsx do dashboard ou settings/page.tsx
          */}
          {children}
        </main>
      </div>
    </div>
  );
}