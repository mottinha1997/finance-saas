/**
 * ====================================================================
 * GRÁFICO DE VISÃO GERAL - Histórico de Gastos
 * ====================================================================
 * Componente que renderiza um gráfico de barras com histórico de despesas
 * Usa biblioteca Recharts para visualização de dados
 * 
 * Exibe:
 * - Últimos 7 dias de gastos
 * - Valor total de despesas por dia
 * - Formatação em Real (R$)
 */

"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

// ====================================================================
// TYPES
// ====================================================================

interface OverviewChartProps {
  /**
   * Array de dados para o gráfico
   * Cada objeto representa um dia com gastos
   */
  data: {
    /** Data no formato DD/MM (ex: "01/12") */
    date: string
    /** Valor total gasto no dia */
    amount: number
  }[]
}

export function OverviewChart({ data }: OverviewChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        {/* ============================================================
            EIXO X - Datas
            ============================================================ */}
        <XAxis
          dataKey="date"
          stroke="#888888"
          fontSize={12}
          tickLine={false}   // Remove linhas de marcação
          axisLine={false}   // Remove linha do eixo
        />

        {/* ============================================================
            EIXO Y - Valores
            Formata valores como moeda (R$)
            ============================================================ */}
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `R$${value}`} // Adiciona R$ nos valores
        />

        {/* ============================================================
            TOOLTIP - Informações ao passar mouse
            Estilização customizada para melhor visual
            ============================================================ */}
        <Tooltip
          cursor={{ fill: 'transparent' }}  // Cursor invisível ao hover
          contentStyle={{
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' // Sombra suave
          }}
        />

        {/* ============================================================
            BARRAS - Representação dos valores
            ============================================================ */}
        <Bar
          dataKey="amount"
          fill="currentColor"        // Usa cor do tema atual
          radius={[4, 4, 0, 0]}      // Bordas arredondadas no topo
          className="fill-primary"    // Cor primary do tema
        />
      </BarChart>
    </ResponsiveContainer>
  )
}