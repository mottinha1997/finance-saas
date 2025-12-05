'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateTransaction } from "@/app/(dashboard)/actions"
import { TRANSACTION_CATEGORIES } from "@/lib/constants"

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: any;
}

export function EditTransactionDialog({ open, onOpenChange, transaction }: EditTransactionDialogProps) {
  const [type, setType] = useState<"INCOME" | "EXPENSE">(transaction.type as "INCOME" | "EXPENSE")
  const [isFixed, setIsFixed] = useState(Boolean(transaction.isFixed))

  async function handleSubmit(formData: FormData) {
    // Garantia extra: Forçamos o envio do checkbox via JS também
    if (type === 'EXPENSE' && isFixed) {
        formData.set('isFixed', 'on');
    } else {
        formData.delete('isFixed');
    }

    await updateTransaction(formData);
    onOpenChange(false);
  }

  // Define categorias dinâmicas
  let categoriesToShow = TRANSACTION_CATEGORIES.EXPENSE_VARIABLE;
  if (type === 'INCOME') categoriesToShow = TRANSACTION_CATEGORIES.INCOME;
  else if (isFixed) categoriesToShow = TRANSACTION_CATEGORIES.EXPENSE_FIXED;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
        </DialogHeader>
        
        <form action={handleSubmit} className="grid gap-4 py-4">
          <input type="hidden" name="id" value={transaction.id} />

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Tipo</Label>
            <div className="col-span-3">
                <Select name="type" defaultValue={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="EXPENSE">Despesa</SelectItem>
                    <SelectItem value="INCOME">Receita</SelectItem>
                </SelectContent>
                </Select>
            </div>
          </div>

          {/* CHECKBOX CORRIGIDO */}
          {type === 'EXPENSE' && (
             <div className="grid grid-cols-4 items-center gap-4">
               <Label className="text-right"></Label>
               <div className="col-span-3 flex items-center space-x-2">
                 <input 
                   type="checkbox" 
                   id="edit-isFixed" 
                   name="isFixed" // <--- ADICIONADO: Essencial para formulários HTML
                   value="on"     // <--- ADICIONADO: Valor padrão de checkboxes
                   checked={isFixed}
                   onChange={(e) => setIsFixed(e.target.checked)}
                   className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                 />
                 <Label htmlFor="edit-isFixed" className="font-normal cursor-pointer">
                   É despesa fixa?
                 </Label>
               </div>
             </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Categoria</Label>
            <div className="col-span-3">
                <Select name="category" defaultValue={transaction.category || ""} required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    {categoriesToShow.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Descrição</Label>
            <Input id="description" name="description" defaultValue={transaction.description} className="col-span-3" required />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">Valor</Label>
            <Input id="amount" name="amount" type="number" step="0.01" defaultValue={Number(transaction.amount)} className="col-span-3" required />
          </div>

          <DialogFooter>
            <Button type="submit">Salvar Alterações</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}