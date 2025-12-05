import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Coluna 1: Sidebar Fixa (Escondida em mobile por enquanto para simplificar) */}
      <div className="hidden border-r bg-muted/40 md:block">
        <Sidebar />
      </div>

      {/* Coluna 2: Conteúdo da Página (Dashboard, Settings, etc) */}
      <div className="flex flex-col">
        {/* Aqui renderiza a página que você está acessando */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}