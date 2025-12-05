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

interface TransactionActionsProps {
  transaction: any; // Usando any para simplificar, mas o ideal seria importar o tipo do Prisma
}

export function TransactionActions({ transaction }: TransactionActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  async function handleDelete() {
    if (confirm("Tem certeza que deseja excluir essa transação?")) {
      await deleteTransaction(transaction.id);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Trash className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* O Modal de Edição fica aqui, invisível até ser chamado */}
      <EditTransactionDialog 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        transaction={transaction} 
      />
    </>
  );
}