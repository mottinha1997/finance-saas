/**
 * ====================================================================
 * SERVER ACTION - Atualizar Configurações
 * ====================================================================
 * Server Action para salvar configurações de orçamento do usuário
 * 
 * Dados salvos:
 * - monthlyBudget: Meta mensal de gastos variáveis
 * - monthlyIncome: Renda mensal estimada
 * 
 * Comportamento:
 * - Usa upsert para criar ou atualizar configurações
 * - Revalida cache do dashboard após salvar
 * - Redireciona para dashboard após sucesso
 */

'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"

/**
 * Atualiza ou cria configurações de orçamento do usuário
 * 
 * @param formData - Dados do formulário contendo monthlyBudget e monthlyIncome
 * @throws Error se usuário não autenticado
 * 
 * Side effects:
 * - Cria usuário no banco se não existir
 * - Upsert nas configurações (cria ou atualiza)
 * - Revalida cache das páginas afetadas
 * - Redireciona para dashboard
 */
export async function updateSettings(formData: FormData) {
  // ====================================================================
  // AUTENTICAÇÃO
  // ====================================================================

  const { userId } = await auth();
  const userClerk = await currentUser();

  if (!userId || !userClerk) {
    throw new Error("Não autorizado");
  }

  // ====================================================================
  // VERIFICAÇÃO/CRIAÇÃO DE USUÁRIO
  // ====================================================================

  // Busca usuário no banco
  let dbUser = await prisma.user.findUnique({ where: { clerkUserId: userId } })

  // Se não existe, cria automaticamente
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        clerkUserId: userId,
        email: userClerk.emailAddresses[0].emailAddress,
        name: userClerk.firstName,
      }
    })
  }

  // ====================================================================
  // EXTRAÇÃO E VALIDAÇÃO DE DADOS
  // ====================================================================

  // Converte strings do formulário para números
  const monthlyBudget = parseFloat(formData.get("monthlyBudget") as string)
  const monthlyIncome = parseFloat(formData.get("monthlyIncome") as string)

  // ====================================================================
  // SALVAR CONFIGURAÇÕES
  // ====================================================================

  /**
   * Upsert: Update or Insert
   * - Se registro existe: atualiza
   * - Se não existe: cria novo
   * 
   * Garante que sempre teremos configurações para o usuário
   */
  await prisma.userSettings.upsert({
    where: { userId: dbUser.idString },
    update: {
      monthlyBudget,
      monthlyIncome
    },
    create: {
      userId: dbUser.idString,
      monthlyBudget,
      monthlyIncome
    }
  })

  // ====================================================================
  // REVALIDAÇÃO E REDIRECIONAMENTO
  // ====================================================================

  /**
   * Revalida cache de páginas afetadas
   * Força Next.js a re-renderizar com novos dados
   */
  revalidatePath("/")           // Dashboard usa essas configurações
  revalidatePath("/settings")   // Página de settings mostra valores salvos

  /**
   * Redireciona para dashboard
   * Usuário verá imediatamente o impacto das mudanças
   */
  redirect("/")
}