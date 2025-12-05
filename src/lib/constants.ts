/**
 * ====================================================================
 * CONSTANTES - Categorias de Transações
 * ====================================================================
 * Define todas as categorias disponíveis para classificar transações
 * Categorias são dinâmicas baseadas no tipo e natureza da transação
 * 
 * Estrutura:
 * - INCOME: Categorias para receitas/entradas
 * - EXPENSE_FIXED: Categorias para despesas fixas mensais
 * - EXPENSE_VARIABLE: Categorias para despesas variáveis
 */

export const TRANSACTION_CATEGORIES = {
  /**
   * Categorias de RECEITA (Entradas)
   *  - Salário: Renda do trabalho CLT/PJ
   * - Freelancer: Trabalhos autônomos/projetos
   * - Renda Extra: Vendas ocasionais, bicos
   * - Dividendos: Rendimentos de investimentos
   * - Outros: Outras fontes de renda
   */
  INCOME: [
    "Salário",
    "Freelancer",
    "Renda Extra",
    "Dividendos",
    "Outros"
  ],

  /**
   * Categorias de DESPESA FIXA (Gastos mensais recorrentes)
   * - Aluguel/Condomínio: Moradia fixa
   * - Internet/Luz/Água: Contas de serviços essenciais
   * - Parcela Dívida: Financiamentos, empréstimos
   * - Assinaturas: Netflix, Spotify, academia, etc
   * - Seguro: Seguro de vida, saúde, carro
   */
  EXPENSE_FIXED: [
    "Aluguel/Condomínio",
    "Internet/Luz/Água",
    "Parcela Dívida",
    "Assinaturas",
    "Seguro"
  ],

  /**
   * Categorias de DESPESA VARIÁVEL (Gastos não fixos)
   * - Alimentação: Supermercado, restaurantes
   * - Transporte: Gasolina, Uber, transporte público
   * - Lazer: Cinema,Jogos, passeios
   * - Compras: Vestuário, eletrônicos
   * - Saúde/Farmácia: Remédios, consultas
   */
  EXPENSE_VARIABLE: [
    "Alimentação",
    "Transporte",
    "Lazer",
    "Compras",
    "Saúde/Farmácia"
  ]
};