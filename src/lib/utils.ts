/**
 * ====================================================================
 * UTILS - Utility Functions
 * ====================================================================
 * Funções auxiliares reutilizáveis em toda aplicação
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina classes CSS com merge inteligente do Tailwind
 * 
 * Permite passar múltiplos valores de classe e resolve conflitos automaticamente
 * Muito útil para componentes que aceitam className como prop
 * 
 * Exemplo de uso:
 * ```tsx
 * <div className={cn("text-red-500", isActive && "text-blue-500", className)} />
 * ```
 * 
 * Como funciona:
 * 1. clsx: Combina classes condicionalmente (aceita strings, objetos, arrays)
 * 2. twMerge: Resolve conflitos de classes Tailwind (ex: text-red-500 vs text-blue-500)
 * 
 * @param inputs - Array de valores de classe (strings, objetos, arrays, condicionais)
 * @returns String com classes combinadas e conflitos resolvidos
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
