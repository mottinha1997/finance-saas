'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTransaction } from "@/app/(dashboard)/actions"
import { PlusCircle } from "lucide-react"
import { TRANSACTION_CATEGORIES } from "@/lib/constants"

export function AddTransactionDialog() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE")
  const [isFixed, setIsFixed] = useState(false)

  async function handleSubmit(formData: FormData) {
    // Garantia extra: Forçamos o envio do checkbox via JS também
    if (type === 'EXPENSE' && isFixed) {
        formData.set('isFixed', 'on');
    } else {
        formData.delete('isFixed');
    }
    
    await createTransaction(formData)
    
    // Reseta os estados após salvar
    setOpen(false)
    setIsFixed(false) 
    setType("EXPENSE")
  }

  // Define qual lista de categorias mostrar
  let categoriesToShow = TRANSACTION_CATEGORIES.EXPENSE_VARIABLE;
  if (type === 'INCOME') {
    categoriesToShow = TRANSACTION_CATEGORIES.INCOME;
  } else if (isFixed) {
    categoriesToShow = TRANSACTION_CATEGORIES.EXPENSE_FIXED;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Transação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Movimentação</DialogTitle>
          <DialogDescription>Cadastre entradas ou saídas.</DialogDescription>
        </DialogHeader>
        
        <form action={handleSubmit} className="grid gap-4 py-4">
          {/* 1. TIPO */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Tipo</Label>
            <div className="col-span-3">
                <Select name="type" value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="EXPENSE">Despesa (Saída)</SelectItem>
                    <SelectItem value="INCOME">Receita (Entrada)</SelectItem>
                </SelectContent>
                </Select>
            </div>
          </div>

          {/* 2. É FIXA? (Só aparece se for Despesa) */}
          {type === 'EXPENSE' && (
             <div className="grid grid-cols-4 items-center gap-4">
               <Label className="text-right"></Label>
               <div className="col-span-3 flex items-center space-x-2">
                 {/* AQUI ESTAVA O PROBLEMA: Adicionei name e value */}
                 <input 
                   type="checkbox" 
                   id="isFixed" 
                   name="isFixed"  // <--- IMPORTANTE
                   value="on"      // <--- IMPORTANTE
                   checked={isFixed}
                   onChange={(e) => setIsFixed(e.target.checked)}
                   className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                 />
                 <Label htmlFor="isFixed" className="font-normal cursor-pointer">
                   É despesa fixa mensal?
                 </Label>
               </div>
             </div>
          )}

          {/* 3. CATEGORIA (Dinâmica) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Tag</Label>
            <div className="col-span-3">
                <Select name="category" required>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
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
            <Input id="description" name="description" placeholder="Ex: Cliente X" className="col-span-3" required />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">Valor</Label>
            <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" className="col-span-3" required />
          </div>

          <DialogFooter>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}