/**
 * ====================================================================
 * DIÁLOGO DE EDITAR TRANSAÇÃO
 * ====================================================================
 * Componente modal para editar transações existentes
 * Similar ao AddTransactionDialog, mas com valores pré-preenchidos
 * 
 * Diferenças principais vs AddTransactionDialog:
 * - Recebe transação existente por props
 * - Usa defaultValue ao invés de placeholder
 * - Inclui campo hidden com ID da transação
 * - Estados são inicializados com valores da transação
 */

'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateTransaction } from "@/app/(dashboard)/actions"
import { TRANSACTION_CATEGORIES } from "@/lib/constants"

// ====================================================================
// TYPES
// ====================================================================

interface EditTransactionDialogProps {
  /** Controla se o diálogo está aberto */
  open: boolean;

  /** Callback para mudar estado do diálogo */
  onOpenChange: (open: boolean) => void;

  /** Dados da transação a ser editada */
  transaction: any;
}

export function EditTransactionDialog({ open, onOpenChange, transaction }: EditTransactionDialogProps) {
  // ====================================================================
  // ESTADOS INICIALIZADOS COM DADOS DA TRANSAÇÃO
  // ====================================================================

  /** 
   * Tipo da transação (inicializado com valor atual)
   * Usado para controlar categorias dinâmicas
   */
  const [type, setType] = useState<"INCOME" | "EXPENSE">(transaction.type as "INCOME" | "EXPENSE")

  /** 
   * Se é despesa fixa (inicializado com valor atual)
   * Boolean() garante conversão segura para booleano
   */
  const [isFixed, setIsFixed] = useState(Boolean(transaction.isFixed))

  /** 
   * Controla estado de submissão (previne cliques múltiplos)
   */
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ====================================================================
  // HANDLERS
  // ====================================================================

  /**
   * Processa a atualização da transação
   * Envia dados para Server Action e fecha o diálogo
   * 
   * @param e - Evento do formulário
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // CRÍTICO: Previne submissão padrão do formulário HTML
    e.preventDefault()
    e.stopPropagation()

    console.log('[EDIT DIALOG] Iniciando submit do formulário...');

    // PROTEÇÃO: Se já está enviando, ignora novo clique
    if (isSubmitting) {
      console.log('[EDIT DIALOG] Já está submetendo, ignorando...');
      return;
    }

    try {
      const formData = new FormData(e.currentTarget)

      console.log('[EDIT DIALOG] FormData criado:', {
        id: formData.get('id'),
        type: formData.get('type'),
        description: formData.get('description'),
        amount: formData.get('amount'),
        category: formData.get('category'),
        isFixed: formData.get('isFixed')
      });

      /**
       * VALIDAÇÃO MANUAL: Verifica campos obrigatórios
       * A validação HTML5 required não funciona corretamente com Select customizado no Vercel
       */
      const description = formData.get('description') as string;
      const amount = formData.get('amount') as string;
      const category = formData.get('category') as string;

      if (!description || !description.trim()) {
        alert('Por favor, preencha a descrição da transação.');
        return;
      }

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        alert('Por favor, insira um valor válido maior que zero.');
        return;
      }

      if (!category || !category.trim()) {
        alert('Por favor, selecione uma categoria.');
        return;
      }

      // Só ativa isSubmitting DEPOIS de todas as validações passarem
      setIsSubmitting(true)

      /**
       * FIX IMPORTANTE: Garantia extra para o checkbox
       * Mesma lógica do AddTransactionDialog
       */
      if (type === 'EXPENSE' && isFixed) {
        formData.set('isFixed', 'on');
      } else {
        formData.delete('isFixed');
      }

      console.log('[EDIT DIALOG] Validações OK. Chamando updateTransaction...');
      // Envia atualização para Server Action
      await updateTransaction(formData);

      console.log('[EDIT DIALOG] Atualização concluída com sucesso!');
      // Fecha o diálogo após sucesso
      onOpenChange(false);
    } catch (error) {
      console.error('[EDIT DIALOG] Erro ao atualizar transação:', error);
      alert('Erro ao atualizar transação. Verifique o console para mais detalhes.');
    } finally {
      // IMPORTANTE: Sempre reseta isSubmitting
      setIsSubmitting(false)
    }
  }

  // ====================================================================
  // LÓGICA DE CATEGORIAS DINÂMICAS
  // ====================================================================

  /**
   * Define quais categorias mostrar baseado no tipo e se é fixa
   * Mesmo comportamento do AddTransactionDialog
   */
  let categoriesToShow = TRANSACTION_CATEGORIES.EXPENSE_VARIABLE;
  if (type === 'INCOME') categoriesToShow = TRANSACTION_CATEGORIES.INCOME;
  else if (isFixed) categoriesToShow = TRANSACTION_CATEGORIES.EXPENSE_FIXED;

  // ====================================================================
  // RENDERIZAÇÃO
  // ====================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4" noValidate>

          {/* 
            Campo hidden com ID da transação
            Essencial para o servidor saber qual registro atualizar 
          */}
          <input type="hidden" name="id" value={transaction.id} />

          {/* ============================================================
              CAMPO 1: TIPO DE TRANSAÇÃO
              ============================================================ */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Tipo</Label>
            <div className="col-span-3">
              <Select
                name="type"
                defaultValue={type}
                onValueChange={(v: any) => setType(v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Despesa</SelectItem>
                  <SelectItem value="INCOME">Receita</SelectItem>
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
                  id="edit-isFixed"
                  name="isFixed"
                  value="on"
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

          {/* ============================================================
              CAMPO 3: CATEGORIA (DINÂMICA)
              Pré-preenchido com valor atual da transação
              ============================================================ */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Categoria</Label>
            <div className="col-span-3">
              <Select
                name="category"
                defaultValue={transaction.category || ""}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              Pré-preenchido com valor atual
              ============================================================ */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Descrição</Label>
            <Input
              id="description"
              name="description"
              defaultValue={transaction.description}
              className="col-span-3"
            />
          </div>

          {/* ============================================================
              CAMPO 5: VALOR
              Pré-preenchido com valor atual (convertido para número)
              ============================================================ */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">Valor</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              defaultValue={Number(transaction.amount)}
              className="col-span-3"
            />
          </div>

          {/* ============================================================
              BOTÃO DE SUBMIT
              Desabilitado enquanto está salvando
              ============================================================ */}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}