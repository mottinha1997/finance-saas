/**
 * ====================================================================
 * PRISMA CLIENT - Singleton Instance
 * ====================================================================
 * Configuração do cliente Prisma para acesso ao banco de dados
 * 
 * Pattern Singleton:
 * Garante que apenas uma instância do PrismaClient existe em toda aplicação
 * Evita múltiplas conexões com banco de dados em desenvolvimento (hot reload)
 * 
 * Importante:
 * - Em produção: cria uma nova instância
 * - Em desenvolvimento: reutiliza instância global para evitar esgotamento de conexões
 */

import { PrismaClient } from '@prisma/client'

/**
 * Type cast necessário para adicionar prisma ao objeto global
 * Permite persistir instância entre hot reloads no desenvolvimento
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient }

/**
 * Instância do Prisma Client
 * 
 * Lógica:
 * 1. Se já existe instância global, reutiliza (desenvolvimento)
 * 2. Se não existe, cria nova instância com logging
 * 
 * Configuração:
 * - log: ['query'] - Loga todas as queries SQL no console (útil para debug)
 */
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'], // Mostra queries SQL executadas
  })

/**
 * Em desenvolvimento, salva instância no objeto global
 * Previne criação de múltiplas instâncias durante hot reload do Next.js
 * 
 * Por que não em produção?
 * - Produção não tem hot reload, não precisa dessa otimização
 * - Variáveis globais podem causar problemas em ambientes serverless
 */
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma