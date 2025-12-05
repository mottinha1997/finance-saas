/**
 * ====================================================================
 * SERVER ACTIONS - Transações
 * ====================================================================
 * Funções do lado do servidor para manipular transações no banco de dados
 * 
 * Server Actions são funções assíncronas que executam no servidor
 * Garantem segurança ao interagir com banco de dados
 * 
 * Ações disponíveis:
 * - createTransaction: Cria nova transação
 * - updateTransaction: Atualiza transação existente  
 * - deleteTransaction: Remove transação
 */

'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth, currentUser } from "@clerk/nextjs/server"

/**
 * ====================================================================
 * HELPER: Autenticação e Validação de Usuário
 * ====================================================================
 * Verifica se usuário está autenticado e garante que existe no banco
 * Se não existir, cria automaticamente na primeira transação
 * 
 * @returns Objeto do usuário do banco de dados
 * @throws Error se usuário não autenticado
 */
async function getAuthenticatedUser() {
  // Busca dados de autenticação do Clerk
  const { userId } = await auth()
  const userClerk = await currentUser()

  // Valida autenticação
  if (!userId || !userClerk) {
    throw new Error("Usuário não autenticado")
  }

  // Busca usuário no banco de dados
  let dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId }
  })

  // Se usuário não existe no banco, cria automaticamente
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        clerkUserId: userId,
        email: userClerk.emailAddresses[0].emailAddress,
        name: userClerk.firstName + " " + userClerk.lastName,
      }
    })
  }

  return dbUser;
}

/**
 * ====================================================================
 * ACTION: Criar Nova Transação
 * ====================================================================
 * Cria uma nova transação (receita ou despesa) no banco de dados
 * 
 * @param formData - Dados do formulário com campos: description, amount, category, type, isFixed
 * @throws Error se campos obrigatórios estiverem faltando
 * 
 * Campos obrigatórios:
 * - description: Descrição da transação
 * - amount: Valor (número decimal)
 * - category: Categoria da transação
 * - type: INCOME ou EXPENSE
 * 
 * Campos opcionais:
 * - isFixed: Se é despesa fixa (apenas para EXPENSE)
 */
export async function createTransaction(formData: FormData) {
  // Valida usuário autenticado
  const user = await getAuthenticatedUser();

  // Extrai dados do formulário
  const description = formData.get("description") as string
  const amount = parseFloat(formData.get("amount") as string)
  const category = formData.get("category") as string
  const type = formData.get("type") as "INCOME" | "EXPENSE"

  /**
   * Tratamento especial para checkbox
   * Checkbox HTML envia "on" quando marcado, ou nada quando desmarcado
   */
  const rawFixed = formData.get("isFixed");
  const isFixed = rawFixed === "on" || rawFixed === "true";

  // Validação de campos obrigatórios
  if (!description || !amount || !category || !type) {
    throw new Error("Campos obrigatórios faltando")
  }

  // Cria transação no banco
  await prisma.transaction.create({
    data: {
      userId: user.idString,
      description,
      amount,
      category,
      type,
      isFixed,
      date: new Date(), // Data/hora atual
    },
  })

  // Revalida cache da página dashboard para mostrar nova transação
  revalidatePath("/")
}

/**
 * ====================================================================
 * ACTION: Atualizar Transação Existente
 * ====================================================================
 * Atualiza todos os campos de uma transação existente
 * Valida que a transação pertence ao usuário autenticado
 * 
 * @param formData - Dados do formulário incluindo id da transação
 * @throws Error se dados inválidos ou transação não encontrada
 */
export async function updateTransaction(formData: FormData) {
  // Valida usuário autenticado
  const user = await getAuthenticatedUser();

  // Extrai dados do formulário
  const id = formData.get("id") as string;
  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const category = formData.get("category") as string;
  const type = formData.get("type") as "INCOME" | "EXPENSE";

  // Tratamento especial para checkbox
  const rawFixed = formData.get("isFixed");
  const isFixed = rawFixed === "on" || rawFixed === "true";

  // Validação de campos obrigatórios
  if (!id || !description || !amount || !category || !type) {
    throw new Error("Dados inválidos");
  }

  /**
   * Usa updateMany ao invés de update para garantir que apenas
   * transações do usuário autenticado sejam atualizadas
   * Previne que usuário A atualize transação de usuário B
   */
  await prisma.transaction.updateMany({
    where: {
      id,
      userId: user.idString // Proteção de segurança
    },
    data: {
      description,
      amount,
      category,
      type,
      isFixed: isFixed as any,
    },
  });

  // Revalida cache para exibir dados atualizados
  revalidatePath("/");
}

/**
 * ====================================================================
 * ACTION: Deletar Transação
 * ====================================================================
 * Remove permanentemente uma transação do banco de dados
 * Valida que a transação pertence ao usuário autenticado
 * 
 * @param id - ID da transação a ser deletada
 * 
 * Segurança:
 * - Usa deleteMany com filtro de userId
 * - Garante que usuário só possa deletar suas próprias transações
 */
export async function deleteTransaction(id: string) {
  // Valida usuário autenticado
  const user = await getAuthenticatedUser();

  /**
   * Usa deleteMany ao invés de delete para segurança
   * Se a transação não pertencer ao usuário, nada será deletado
   */
  await prisma.transaction.deleteMany({
    where: {
      id: id,
      userId: user.idString // Proteção de segurança
    },
  });

  // Revalida cache para remover transação da visualização
  revalidatePath("/");
}