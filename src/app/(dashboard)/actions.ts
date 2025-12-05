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
import {
  validateTransactionData,
  validateId,
  createDuplicateKey,
  isDuplicateTransaction,
  recordTransaction
} from "@/lib/validation"

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
 * @returns { success, error } - Resultado da operação
 */
export async function createTransaction(formData: FormData) {
  try {
    console.log('[CREATE] Iniciando validação e criação de transação...');

    // ============================================================
    // ETAPA 1: Autenticação
    // ============================================================
    const user = await getAuthenticatedUser();
    console.log('[CREATE] Usuário autenticado:', user.idString);

    // ============================================================
    // ETAPA 2: Extração de Dados Brutos
    // ============================================================
    const description = formData.get("description") as string;
    const amountRaw = formData.get("amount") as string;
    const category = formData.get("category") as string;
    const type = formData.get("type") as "INCOME" | "EXPENSE";
    const rawFixed = formData.get("isFixed");

    console.log('[CREATE] Dados recebidos:', { description, amountRaw, category, type, rawFixed });

    // Converte amount para number
    const amount = parseFloat(amountRaw);

    // Converte isFixed para boolean
    const isFixed = rawFixed === "on" || rawFixed === "true";

    // ============================================================
    // ETAPA 3: Validação Robusta
    // ============================================================
    const validation = validateTransactionData({
      description,
      amount,
      category,
      type,
      isFixed
    });

    if (!validation.success) {
      console.error('[CREATE] Validação falhou:', validation.error);
      return {
        success: false,
        error: validation.error
      };
    }

    const sanitizedData = validation.sanitizedData!;
    console.log('[CREATE] Validação OK. Dados sanitizados:', sanitizedData);

    // ============================================================
    // ETAPA 4: Verificação de Duplicata
    // ============================================================
    const duplicateKey = createDuplicateKey(
      user.idString,
      sanitizedData.description,
      sanitizedData.amount,
      sanitizedData.type
    );

    if (isDuplicateTransaction(duplicateKey)) {
      console.warn('[CREATE] Transação duplicada detectada:', duplicateKey);
      return {
        success: false,
        error: 'Transação duplicada detectada. Aguarde alguns segundos antes de tentar novamente.'
      };
    }

    // ============================================================
    // ETAPA 5: Criação no Banco de Dados
    // ============================================================
    await prisma.transaction.create({
      data: {
        userId: user.idString,
        description: sanitizedData.description,
        amount: sanitizedData.amount,
        category: sanitizedData.category,
        type: sanitizedData.type,
        isFixed: sanitizedData.isFixed,
        date: new Date(),
      },
    });

    // Registra transação como criada (previne duplicatas imediatas)
    recordTransaction(duplicateKey);

    console.log('[CREATE] Transação criada com sucesso!');

    // Revalida cache da página
    revalidatePath("/");

    return {
      success: true
    };

  } catch (error) {
    console.error('[CREATE] Erro inesperado:', error);
    return {
      success: false,
      error: 'Erro ao criar transação. Tente novamente.'
    };
  }
}

/**
 * ====================================================================
 * ACTION: Atualizar Transação Existente
 * ====================================================================
 * Atualiza todos os campos de uma transação existente
 * Valida que a transação pertence ao usuário autenticado
 * 
 * @param formData - Dados do formulário incluindo id da transação
 * @returns { success, error } - Resultado da operação
 */
export async function updateTransaction(formData: FormData) {
  try {
    console.log('[UPDATE] Iniciando atualização de transação...');

    // ============================================================
    // ETAPA 1: Autenticação
    // ============================================================
    const user = await getAuthenticatedUser();
    console.log('[UPDATE] Usuário autenticado:', user.idString);

    // ============================================================
    // ETAPA 2: Extração de Dados Brutos
    // ============================================================
    const id = formData.get("id") as string;
    const description = formData.get("description") as string;
    const amountRaw = formData.get("amount") as string;
    const category = formData.get("category") as string;
    const type = formData.get("type") as "INCOME" | "EXPENSE";
    const rawFixed = formData.get("isFixed");

    console.log('[UPDATE] Dados recebidos:', { id, description, category, type, rawFixed });

    const amount = parseFloat(amountRaw);
    const isFixed = rawFixed === "on" || rawFixed === "true";

    // ============================================================
    // ETAPA 3: Validação de ID
    // ============================================================
    const idValidation = validateId(id);
    if (!idValidation.success) {
      console.error('[UPDATE] ID inválido:', idValidation.error);
      return {
        success: false,
        error: idValidation.error
      };
    }

    // ============================================================
    // ETAPA 4: Validação de Dados
    // ============================================================
    const validation = validateTransactionData({
      description,
      amount,
      category,
      type,
      isFixed
    });

    if (!validation.success) {
      console.error('[UPDATE] Validação falhou:', validation.error);
      return {
        success: false,
        error: validation.error
      };
    }

    const sanitizedData = validation.sanitizedData!;
    console.log('[UPDATE] Validação OK. Dados sanitizados:', sanitizedData);

    // ============================================================
    // ETAPA 5: Verificação de Duplicata
    // ============================================================
    const duplicateKey = createDuplicateKey(
      user.idString,
      sanitizedData.description,
      sanitizedData.amount,
      sanitizedData.type
    );

    if (isDuplicateTransaction(duplicateKey)) {
      console.warn('[UPDATE] Transação duplicada detectada:', duplicateKey);
      return {
        success: false,
        error: 'Modificação duplicada detectada. Aguarde alguns segundos.'
      };
    }

    // ============================================================
    // ETAPA 6: Atualização no Banco
    // ============================================================
    const result = await prisma.transaction.updateMany({
      where: {
        id,
        userId: user.idString // Proteção de segurança
      },
      data: {
        description: sanitizedData.description,
        amount: sanitizedData.amount,
        category: sanitizedData.category,
        type: sanitizedData.type,
        isFixed: sanitizedData.isFixed,
      },
    });

    // Registra como processado
    recordTransaction(duplicateKey);

    console.log('[UPDATE] Transação atualizada com sucesso! Registros afetados:', result.count);

    // Revalida cache
    revalidatePath("/");

    return {
      success: true
    };

  } catch (error) {
    console.error('[UPDATE] Erro inesperado:', error);
    return {
      success: false,
      error: 'Erro ao atualizar transação. Tente novamente.'
    };
  }
}

/**
 * ====================================================================
 * ACTION: Deletar Transação
 * ====================================================================
 * Remove permanentemente uma transação do banco de dados
 * Valida que a transação pertence ao usuário autenticado
 * 
 * @param id - ID da transação a ser deletada
 * @returns { success, error, count } - Resultado da operação
 */
export async function deleteTransaction(id: string) {
  try {
    console.log('[DELETE] Iniciando exclusão de transação:', id);

    // Valida ID
    const idValidation = validateId(id);
    if (!idValidation.success) {
      console.error('[DELETE] ID inválido:', idValidation.error);
      return {
        success: false,
        error: idValidation.error,
        count: 0
      };
    }

    // Autenticação
    const user = await getAuthenticatedUser();

    // Deleta do banco
    const result = await prisma.transaction.deleteMany({
      where: {
        id: id,
        userId: user.idString // Proteção de segurança
      },
    });

    console.log('[DELETE] Transação deletada. Registros afetados:', result.count);

    // Revalida cache
    revalidatePath("/");

    return {
      success: true,
      count: result.count
    };

  } catch (error) {
    console.error('[DELETE] Erro inesperado:', error);
    return {
      success: false,
      error: 'Erro ao deletar transação. Tente novamente.',
      count: 0
    };
  }
}