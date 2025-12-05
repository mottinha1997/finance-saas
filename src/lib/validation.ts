/**
 * ====================================================================
 * VALIDAÇÃO DE TRANSAÇÕES - Módulo Server-Side
 * ====================================================================
 * Validação robusta e centralizada para todas as operações de transação
 * 
 * Garante integridade dos dados mesmo se front-end falhar
 * Previne inserções duplicadas e dados inválidos
 */

import { TRANSACTION_CATEGORIES } from './constants';

// ====================================================================
// TYPES
// ====================================================================

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface TransactionInput {
    description: string;
    amount: number;
    category: string;
    type: TransactionType;
    isFixed?: boolean;
}

export interface ValidationResult {
    success: boolean;
    error?: string;
    sanitizedData?: TransactionInput;
}

// ====================================================================
// CONSTANTES DE VALIDAÇÃO
// ====================================================================

const VALIDATION_RULES = {
    DESCRIPTION_MAX_LENGTH: 200,
    DESCRIPTION_MIN_LENGTH: 1,
    AMOUNT_MIN: 0.01,
    AMOUNT_MAX: 1_000_000_000, // 1 bilhão
    DUPLICATE_WINDOW_MS: 2000, // 2 segundos
} as const;

// ====================================================================
// VALIDAÇÃO DE DADOS
// ====================================================================

/**
 * Valida e sanitiza dados de transação
 * Garante que todos os campos estão corretos e seguros
 * 
 * @param data - Dados brutos da transação
 * @returns Resultado da validação com dados sanitizados
 */
export function validateTransactionData(data: TransactionInput): ValidationResult {
    // ============================================================
    // VALIDAÇÃO: Descrição
    // ============================================================

    if (!data.description || typeof data.description !== 'string') {
        return {
            success: false,
            error: 'Descrição é obrigatória e deve ser texto'
        };
    }

    const description = data.description.trim();

    if (description.length < VALIDATION_RULES.DESCRIPTION_MIN_LENGTH) {
        return {
            success: false,
            error: 'Descrição não pode estar vazia'
        };
    }

    if (description.length > VALIDATION_RULES.DESCRIPTION_MAX_LENGTH) {
        return {
            success: false,
            error: `Descrição muito longa (máximo ${VALIDATION_RULES.DESCRIPTION_MAX_LENGTH} caracteres)`
        };
    }

    // ============================================================
    // VALIDAÇÃO: Valor (Amount)
    // ============================================================

    if (typeof data.amount !== 'number' || isNaN(data.amount)) {
        return {
            success: false,
            error: 'Valor inválido - deve ser um número'
        };
    }

    if (data.amount < VALIDATION_RULES.AMOUNT_MIN) {
        return {
            success: false,
            error: 'Valor deve ser maior que zero'
        };
    }

    if (data.amount > VALIDATION_RULES.AMOUNT_MAX) {
        return {
            success: false,
            error: 'Valor muito grande (máximo 1 bilhão)'
        };
    }

    // Arredonda para 2 casas decimais
    const amount = Math.round(data.amount * 100) / 100;

    // ============================================================
    // VALIDAÇÃO: Tipo de Transação
    // ============================================================

    if (data.type !== 'INCOME' && data.type !== 'EXPENSE') {
        return {
            success: false,
            error: 'Tipo de transação inválido (deve ser INCOME ou EXPENSE)'
        };
    }

    // ============================================================
    // VALIDAÇÃO: Categoria
    // ============================================================

    if (!data.category || typeof data.category !== 'string') {
        return {
            success: false,
            error: 'Categoria é obrigatória'
        };
    }

    const category = data.category.trim();

    // Verifica se categoria existe nas categorias válidas
    const validCategories = getAllValidCategories();

    if (!validCategories.includes(category)) {
        return {
            success: false,
            error: `Categoria inválida: "${category}"`
        };
    }

    // Verifica se categoria é compatível com o tipo
    if (data.type === 'INCOME' && !TRANSACTION_CATEGORIES.INCOME.includes(category)) {
        return {
            success: false,
            error: 'Categoria não é válida para receitas (INCOME)'
        };
    }

    if (data.type === 'EXPENSE') {
        const isValidExpense =
            TRANSACTION_CATEGORIES.EXPENSE_FIXED.includes(category) ||
            TRANSACTION_CATEGORIES.EXPENSE_VARIABLE.includes(category);

        if (!isValidExpense) {
            return {
                success: false,
                error: 'Categoria não é válida para despesas (EXPENSE)'
            };
        }
    }

    // ============================================================
    // VALIDAÇÃO: isFixed (lógica)
    // ============================================================

    let isFixed = Boolean(data.isFixed);

    // isFixed só faz sentido para EXPENSE
    if (data.type === 'INCOME') {
        isFixed = false;
    }

    // ============================================================
    // RETORNA DADOS SANITIZADOS
    // ============================================================

    return {
        success: true,
        sanitizedData: {
            description,
            amount,
            category,
            type: data.type,
            isFixed
        }
    };
}

/**
 * Retorna todas as categorias válidas (união de todas as listas)
 */
function getAllValidCategories(): string[] {
    return [
        ...TRANSACTION_CATEGORIES.INCOME,
        ...TRANSACTION_CATEGORIES.EXPENSE_FIXED,
        ...TRANSACTION_CATEGORIES.EXPENSE_VARIABLE
    ];
}

/**
 * Verifica se ID é válido (não vazio, string)
 */
export function validateId(id: unknown): ValidationResult {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
        return {
            success: false,
            error: 'ID inválido ou não fornecido'
        };
    }

    return {
        success: true,
        sanitizedData: { id: id.trim() } as any
    };
}

/**
 * Cria uma chave única para identificar transações duplicadas
 * Usado para verificar se transação idêntica foi criada recentemente
 */
export function createDuplicateKey(
    userId: string,
    description: string,
    amount: number,
    type: TransactionType
): string {
    return `${userId}:${type}:${description.toLowerCase()}:${amount.toFixed(2)}`;
}

// ====================================================================
// CACHE DE DUPLICATAS (em memória)
// ====================================================================

/**
 * Cache simples para rastrear transações recentes
 * Map: chave única -> timestamp da última criação
 */
const recentTransactions = new Map<string, number>();

/**
 * Limpa entradas antigas do cache (mais de 5 segundos)
 * Evita crescimento infinito da memória
 */
function cleanOldEntries() {
    const now = Date.now();
    const CLEANUP_THRESHOLD = 5000; // 5 segundos

    for (const [key, timestamp] of recentTransactions.entries()) {
        if (now - timestamp > CLEANUP_THRESHOLD) {
            recentTransactions.delete(key);
        }
    }
}

/**
 * Verifica se transação é duplicata recente (criada há menos de 2 segundos)
 * 
 * @returns true se é duplicata, false se pode prosseguir
 */
export function isDuplicateTransaction(key: string): boolean {
    cleanOldEntries();

    const lastCreated = recentTransactions.get(key);

    if (!lastCreated) {
        return false; // Primeira vez criando
    }

    const timeSinceLastCreation = Date.now() - lastCreated;

    return timeSinceLastCreation < VALIDATION_RULES.DUPLICATE_WINDOW_MS;
}

/**
 * Registra que uma transação foi criada/atualizada agora
 */
export function recordTransaction(key: string): void {
    recentTransactions.set(key, Date.now());
}
