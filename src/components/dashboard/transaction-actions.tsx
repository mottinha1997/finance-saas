/**
 * ====================================================================
 * COMPONENT: Ações de Transação (Dropdown Menu)
 * ====================================================================
 * Menu de ações para cada transação na tabela
 * Permite editar ou excluir transações
 * 
 * Funcionalidades:
 * - Menu dropdown com ícone de três pontos
 * - Opção de editar (abre modal de edição)
 * - Opção de excluir (com confirmação)
 */

"use client"

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteTransaction } from "@/app/(dashboard)/actions";
import { EditTransactionDialog } from "./edit-transaction-dialog";

// ====================================================================
// TYPES
// ====================================================================

interface TransactionActionsProps {
  /** 
   * Dados da transação
   * Idealmente deveria usar tipo do Prisma, mas any simplifica
   */
  transaction: any;
}

export function TransactionActions({ transaction }: TransactionActionsProps) {
  // ====================================================================
  // ESTADO
  // ====================================================================

  /** Controla se o modal de edição está aberto */
  const [isEditOpen, setIsEditOpen] = useState(false);

  // ====================================================================
  // HANDLERS
  // ====================================================================

  /**
   * Handler para excluir transação
   * Mostra confirmação antes de executar
   * Chama Server Action para deletar do banco
   */
  async function handleDelete() {
    console.log('[TRANSACTION ACTIONS] Botão delete clicado');

    // Confirmação nativa do navegador
    if (confirm("Tem certeza que deseja excluir essa transação?")) {
      console.log('[TRANSACTION ACTIONS] Confirmação aceita, deletando transação:', transaction.id);
      try {
        await deleteTransaction(transaction.id);
        console.log('[TRANSACTION ACTIONS] Transação deletada com sucesso!');
      } catch (error) {
        console.error('[TRANSACTION ACTIONS] Erro ao deletar transação:', error);
        alert('Erro ao excluir transação. Verifique o console para mais detalhes.');
      }
    } else {
      console.log('[TRANSACTION ACTIONS] Confirmação cancelada');
    }
  }

  // ====================================================================
  // RENDERIZAÇÃO
  // ====================================================================

  return (
    <>
      {/* Menu Dropdown */}
      <DropdownMenu>
        {/* Botão trigger (três pontos) */}
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        {/* Conteúdo do menu (opções) */}
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>

          {/* Opção: Editar */}
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>

          {/* Opção: Excluir (em vermelho) */}
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Trash className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 
        Modal de Edição
        Fica renderizado mas invisível até ser aberto
        Usar pattern de renderização condicional (isEditOpen && <...>)
        não é ideal pois perde estado quando fecha
      */}
      <EditTransactionDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        transaction={transaction}
      />
    </>
  );
}