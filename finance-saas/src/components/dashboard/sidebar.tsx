import Link from "next/link";
import { LayoutDashboard, Settings, PieChart } from "lucide-react";
import { UserButton } from "@clerk/nextjs"; 

export function Sidebar() {
  return (
    <div className="flex h-full flex-col border-r bg-muted/10">
      {/* Logo / Título */}
      <div className="flex h-14 items-center border-b px-6">
        <PieChart className="mr-2 h-6 w-6 text-emerald-600" />
        <span className="font-bold text-lg">Finance SaaS</span>
      </div>

      {/* Links de Navegação */}
      <nav className="flex-1 space-y-1 p-4">
        <Link 
          href="/" 
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition-all"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        
        <Link 
          href="/settings" 
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition-all"
        >
          <Settings className="h-4 w-4" />
          Configurações
        </Link>
      </nav>
      
      {/* RODAPÉ DO MENU COM O BOTÃO DE PERFIL */}
      <div className="border-t p-4 flex items-center gap-4">
        {/* Componente do Clerk que gerencia o Avatar e o Logout */}
        <UserButton showName /> 
        <div className="text-xs text-muted-foreground">
          <p>Conta Gratuita</p>
        </div>
      </div>
    </div>
  );
}