/**
 * ====================================================================
 * DASHBOARD - Página Principal
 * ====================================================================
 * Página principal do dashboard financeiro que exibe:
 * - Métricas financeiras (saldo, gastos, previsões)
 * - Gráfico de histórico de gastos
 * - Lista de transações recentes
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, Wallet, CalendarClock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AddTransactionDialog } from "@/components/dashboard/add-transaction-dialog";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { TransactionActions } from "@/components/dashboard/transaction-actions";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Formata um número como moeda brasileira (R$)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada como "R$ X.XXX,XX"
 */
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

/**
 * Converte valores de forma segura para número
 * Previne erros com valores null, undefined ou Decimal
 * @param value - Valor a ser convertido
 * @returns Número convertido ou 0 se inválido
 */
const safeNumber = (value: any): number => {
  if (!value) return 0;
  return Number(value.toString());
};

export default async function DashboardPage() {
  // ====================================================================
  // AUTENTICAÇÃO E VALIDAÇÃO DE USUÁRIO
  // ====================================================================

  const { userId } = await auth();

  // Redireciona para login se não autenticado
  if (!userId) {
    redirect("/sign-in");
  }

  // Busca usuário no banco de dados
  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId }
  });

  // Se usuário não existe no banco, mostra tela de boas-vindas
  if (!dbUser) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <AddTransactionDialog />
        </div>
        <div className="text-center mt-20">
          <h3 className="text-lg font-medium">Bem-vindo!</h3>
          <p className="text-muted-foreground">Cadastre sua primeira transação para ativar sua conta.</p>
        </div>
      </div>
    )
  }

  // ====================================================================
  // BUSCA DE DADOS
  // ====================================================================

  // Busca todas as transações do usuário (ordenadas por data mais recente)
  const allTransactions = await prisma.transaction.findMany({
    where: { userId: dbUser.idString },
    orderBy: { date: 'desc' },
  });

  // Pega apenas as 5 transações mais recentes para a tabela
  const recentTransactions = allTransactions.slice(0, 5);

  // Busca configurações do usuário (metas financeiras)
  const userSettings = await prisma.userSettings.findUnique({
    where: { userId: dbUser.idString }
  });

  // ====================================================================
  // SEPARAÇÃO DE TRANSAÇÕES POR TIPO
  // ====================================================================

  // Filtra receitas (entradas de dinheiro)
  const incomeTransactions = allTransactions.filter(t => t.type === 'INCOME');

  // Filtra despesas (saídas de dinheiro)
  const expenseTransactions = allTransactions.filter(t => t.type === 'EXPENSE');

  // ====================================================================
  // CÁLCULOS FINANCEIROS - RECEITAS E DESPESAS
  // ====================================================================

  // Soma total de todas as receitas
  const totalIncome = incomeTransactions.reduce((acc, t) => acc + safeNumber(t.amount), 0);

  // Soma total das despesas fixas (aluguel, contas fixas, etc)
  const fixedExpenses = expenseTransactions
    .filter(t => t.isFixed === true)
    .reduce((acc, t) => acc + safeNumber(t.amount), 0);

  // Soma total das despesas variáveis (compras, lazer, etc)
  const variableExpenses = expenseTransactions
    .filter(t => !t.isFixed)
    .reduce((acc, t) => acc + safeNumber(t.amount), 0);

  // Saldo atual: Receitas - (Despesas Fixas + Despesas Variáveis)
  const currentBalance = totalIncome - (fixedExpenses + variableExpenses);

  // Meta mensal de gastos variáveis configurada pelo usuário
  const VARIABLE_GOAL = safeNumber(userSettings?.monthlyBudget);

  // ====================================================================
  // CÁLCULOS DE DATA E ORÇAMENTO DIÁRIO
  // ====================================================================

  const currentDate = new Date();

  // Calcula quantos dias tem no mês atual
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

  // Dia atual do mês
  const currentDay = currentDate.getDate();

  // Dias restantes no mês
  const daysRemaining = daysInMonth - currentDay;

  // Quanto ainda pode gastar da meta variável
  const remainingVariableBudget = VARIABLE_GOAL - variableExpenses;

  // Quanto pode gastar por dia para não estourar a meta
  // Se não há dias restantes, mostra o valor total restante
  const dailyCap = daysRemaining > 0
    ? (remainingVariableBudget / daysRemaining)
    : remainingVariableBudget;

  // ====================================================================
  // CÁLCULOS DE PROGRESSO E PREVISÕES
  // ====================================================================

  // Percentual gasto da meta variável (limitado a 100%)
  const variableProgress = VARIABLE_GOAL > 0
    ? Math.min((variableExpenses / VARIABLE_GOAL) * 100, 100)
    : 0;

  /**
   * Previsão de sobra no final do mês
   * Calcula: Receitas - Despesas Fixas - Meta Variável
   * 
   * Regra especial: Se não houver receitas ainda (totalIncome = 0),
   * mostra 0 ao invés de negativo para não confundir o usuário
   */
  const projectedBalance = totalIncome > 0
    ? totalIncome - fixedExpenses - VARIABLE_GOAL
    : 0;

  // ====================================================================
  // PREPARAÇÃO DE DADOS PARA GRÁFICO
  // ====================================================================

  /**
   * Agrupa despesas por dia para o gráfico
   * - Pega últimos 7 dias
   * - Soma despesas do mesmo dia
   * - Inverte ordem para mostrar do mais antigo ao mais recente
   */
  const chartData = expenseTransactions
    .reduce((acc, transaction) => {
      const dateStr = transaction.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const existingDay = acc.find(item => item.date === dateStr);
      const val = safeNumber(transaction.amount);

      if (existingDay) {
        // Se o dia já existe, soma ao valor existente
        existingDay.amount += val;
      } else {
        // Se é um dia novo, adiciona ao array
        acc.push({ date: dateStr, amount: val });
      }

      return acc;
    }, [] as { date: string; amount: number }[])
    .slice(0, 7)  // Pega apenas 7 dias
    .reverse();    // Inverte para ordem cronológica

  // ====================================================================
  // RENDERIZAÇÃO DA INTERFACE
  // ====================================================================

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Cabeçalho com título e botão de nova transação */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <AddTransactionDialog />
        </div>
      </div>

      {/* ============================================================
          CARDS DE MÉTRICAS FINANCEIRAS
          ============================================================ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        {/* CARD 1: Pode Gastar Hoje */}
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pode Gastar Hoje</CardTitle>
            <CalendarClock className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {/* Fica vermelho se estourou a meta, verde caso contrário */}
            <div className={`text-2xl font-bold ${dailyCap < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {formatCurrency(dailyCap)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dailyCap < 0 ? "Meta estourada!" : `Meta Variável Livre: ${formatCurrency(remainingVariableBudget)}`}
            </p>
          </CardContent>
        </Card>

        {/* CARD 2: Meta Variável e Progresso */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Variável ({formatCurrency(VARIABLE_GOAL)})</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(variableExpenses)}</div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Gasto Variável</span>
                <span>{variableProgress.toFixed(0)}%</span>
              </div>
              {/* Barra de progresso fica vermelha se passar de 90% */}
              <Progress value={variableProgress} className={`h-2 ${variableProgress > 90 ? "bg-red-200" : ""}`} />
            </div>
          </CardContent>
        </Card>

        {/* CARD 3: Saldo Atual */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {/* Fica vermelho se saldo negativo */}
            <div className={`text-2xl font-bold ${currentBalance < 0 ? "text-red-500" : ""}`}>
              {formatCurrency(currentBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Renda Total: {formatCurrency(totalIncome)}
            </p>
          </CardContent>
        </Card>

        {/* CARD 4: Previsão de Sobra */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Previsão Sobra</CardTitle>
            <TrendingUp className={`h-4 w-4 ${projectedBalance >= 0 ? "text-green-500" : "text-red-500"}`} />
          </CardHeader>
          <CardContent>
            {/* Verde se positivo, vermelho se negativo */}
            <div className={`text-2xl font-bold ${projectedBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(projectedBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Se cumprir a meta e pagar fixos.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================
          GRÁFICO E TABELA DE TRANSAÇÕES
          ============================================================ */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">

        {/* Gráfico de Histórico (ocupa 4 colunas) */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Histórico (Total)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {chartData.length > 0
              ? <OverviewChart data={chartData} />
              : <div className="h-[350px] flex items-center justify-center text-muted-foreground">Sem dados.</div>
            }
          </CardContent>
        </Card>

        {/* Tabela de Extrato Recente (ocupa 3 colunas) */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Extrato Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Desc.</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Mensagem se não houver transações */}
                {recentTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">Vazio.</TableCell>
                  </TableRow>
                )}

                {/* Lista de transações */}
                {recentTransactions.map((t) => (
                  <TableRow key={t.id}>
                    {/* Coluna: Descrição e Data */}
                    <TableCell>
                      <div className="font-medium">{t.description}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {t.date.toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>

                    {/* Coluna: Categoria (com badge) */}
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-[10px] ${t.isFixed ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                        {t.category} {t.isFixed && "(Fixo)"}
                      </span>
                    </TableCell>

                    {/* Coluna: Valor (vermelho para despesa, verde para receita) */}
                    <TableCell className={`text-right ${t.type === 'EXPENSE' ? 'text-red-500' : 'text-green-600'
                      }`}>
                      {t.type === 'EXPENSE' ? '-' : '+'} {safeNumber(t.amount).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </TableCell>

                    {/* Coluna: Ações (editar/deletar) */}
                    <TableCell>
                      <TransactionActions transaction={{ ...t, amount: safeNumber(t.amount) }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}