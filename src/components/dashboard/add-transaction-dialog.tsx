/**
 * ====================================================================
 * DIÁLOGO DE ADICIONAR TRANSAÇÃO
 * ====================================================================
 * Componente modal para cadastrar novas transações financeiras
 * Permite criar tanto receitas (entradas) quanto despesas (saídas)
 * 
 * Funcionalidades:
 * - Seleção de tipo (Receita ou Despesa)
 * - Categorização dinâmica baseada no tipo
 * - Marcação de despesas fixas
 * - Proteção contra múltiplas submissões
 */

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
  // ====================================================================
  // ESTADOS DO COMPONENTE
  // ====================================================================

  /** Controla se o diálogo está aberto ou fechado */
  const [open, setOpen] = useState(false)

  /** Tipo da transação: INCOME (receita) ou EXPENSE (despesa) */
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE")

  /** Indica se a despesa é fixa (só aplicável para EXPENSE) */
  const [isFixed, setIsFixed] = useState(false)

  /** 
   * Controla o estado de submissão do formulário
   * Previne que o usuário clique múltiplas vezes no botão Salvar
   */
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ====================================================================
  // HANDLERS
  // ====================================================================

  /**
   * Processa o envio do formulário
   * Previne múltiplas submissões e garante que dados sejam enviados corretamente
   * 
   * @param e - Evento do formulário
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // PROTEÇÃO: Se já está enviando, ignora novo clique
    if (isSubmitting) return

    try {
      // Extrai dados do formulário
      const formData = new FormData(e.currentTarget)

      /**
       * VALIDAÇÃO MANUAL: Verifica campos obrigatórios
       * A validação HTML5 required não funciona corretamente com Select customizado no Vercel
       */
      const description = formData.get('description') as string;
      const amount = formData.get('amount') as string;
      const category = formData.get('category') as string;

      if (!category || !category.trim()) {
        alert('Por favor, selecione uma categoria.');
        return;
      }

      if (!description || !description.trim()) {
        alert('Por favor, preencha a descrição da transação.');
        return;
      }

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        alert('Por favor, insira um valor válido maior que zero.');
        return;
      }

      // Só ativa isSubmitting DEPOIS de todas as validações passarem
      setIsSubmitting(true)

      /**
       * FIX IMPORTANTE: Garantia extra para o checkbox
       * Checkboxes HTML só enviam dados quando marcados
       * Esta lógica garante que o valor seja enviado corretamente
       */
      if (type === 'EXPENSE' && isFixed) {
        formData.set('isFixed', 'on');
      } else {
        formData.delete('isFixed');
      }

      // Envia para Server Action
      await createTransaction(formData)

      // Reseta o formulário após sucesso
      setOpen(false)
      setIsFixed(false)
      setType("EXPENSE")
    } finally {
      // IMPORTANTE: Sempre reseta isSubmitting, mesmo se houver erro
      setIsSubmitting(false)
    }
  }

  // ====================================================================
  // LÓGICA DE CATEGORIAS DINÂMICAS
  // ====================================================================

  /**
   * Define quais categorias mostrar baseado no tipo e se é fixa
   * 
   * Regras:
   * - Se INCOME: mostra categorias de receita (Salário, Investimentos, etc)
   * - Se EXPENSE + Fixa: mostra categorias de despesa fixa (Aluguel, Internet, etc)
   * - Se EXPENSE + Variável: mostra categorias de despesa variável (Compras, Lazer, etc)
   */
  let categoriesToShow = TRANSACTION_CATEGORIES.EXPENSE_VARIABLE;
  if (type === 'INCOME') {
    categoriesToShow = TRANSACTION_CATEGORIES.INCOME;
  } else if (isFixed) {
    categoriesToShow = TRANSACTION_CATEGORIES.EXPENSE_FIXED;
  }

  // ====================================================================
  // RENDERIZAÇÃO
  // ====================================================================

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Botão que abre o diálogo */}
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Transação
        </Button>
      </DialogTrigger>

      {/* Conteúdo do diálogo */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Movimentação</DialogTitle>
          <DialogDescription>Cadastre entradas ou saídas.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">

          {/* ============================================================
              CAMPO 1: TIPO DE TRANSAÇÃO
              ============================================================ */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Tipo</Label>
            <div className="col-span-3">
              <Select
                name="type"
                value={type}
                onValueChange={(v: any) => setType(v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Despesa (Saída)</SelectItem>
                  <SelectItem value="INCOME">Receita (Entrada)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ============================================================
              CAMPO 2: CHECKBOX DE DESPESA FIXA
              Só aparece quando o tipo é EXPENSE
              ============================================================ */}
          {type === 'EXPENSE' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right"></Label>
              <div className="col-span-3 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isFixed"
                  name="isFixed"
                  value="on"
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

          {/* ============================================================
              CAMPO 3: CATEGORIA (DINÂMICA)
              As opções mudam baseado no tipo e se é fixa
              ============================================================ */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Tag</Label>
            <div className="col-span-3">
              <Select name="category">
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {categoriesToShow.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ============================================================
              CAMPO 4: DESCRIÇÃO
              ============================================================ */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Descrição</Label>
            <Input
              id="description"
              name="description"
              placeholder="Ex: Cliente X"
              className="col-span-3"
            />
          </div>

          {/* ============================================================
              CAMPO 5: VALOR
              ============================================================ */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">Valor</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              className="col-span-3"
            />
          </div>

          {/* ============================================================
              BOTÃO DE SUBMIT
              Desabilitado enquanto está salvando
              Mostra "Salvando..." como feedback visual
              ============================================================ */}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}