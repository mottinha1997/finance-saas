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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const safeNumber = (value: any): number => {
  if (!value) return 0;
  return Number(value.toString()); 
};

export default async function DashboardPage() {
  // CORREÇÃO: Adicionado 'await'
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId }
  });

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

  const allTransactions = await prisma.transaction.findMany({
    where: { userId: dbUser.idString },
    orderBy: { date: 'desc' },
  });

  const recentTransactions = allTransactions.slice(0, 5);

  const userSettings = await prisma.userSettings.findUnique({
    where: { userId: dbUser.idString }
  });

  const incomeTransactions = allTransactions.filter(t => t.type === 'INCOME');
  const expenseTransactions = allTransactions.filter(t => t.type === 'EXPENSE');

  const totalIncome = incomeTransactions.reduce((acc, t) => acc + safeNumber(t.amount), 0);

  const fixedExpenses = expenseTransactions
    .filter(t => t.isFixed === true)
    .reduce((acc, t) => acc + safeNumber(t.amount), 0);

  const variableExpenses = expenseTransactions
    .filter(t => !t.isFixed)
    .reduce((acc, t) => acc + safeNumber(t.amount), 0);

  const currentBalance = totalIncome - (fixedExpenses + variableExpenses);
  const VARIABLE_GOAL = safeNumber(userSettings?.monthlyBudget);
  
  const currentDate = new Date();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const currentDay = currentDate.getDate();
  const daysRemaining = daysInMonth - currentDay;

  const remainingVariableBudget = VARIABLE_GOAL - variableExpenses;
  
  const dailyCap = daysRemaining > 0 
    ? (remainingVariableBudget / daysRemaining) 
    : remainingVariableBudget;

  const variableProgress = VARIABLE_GOAL > 0 
    ? Math.min((variableExpenses / VARIABLE_GOAL) * 100, 100) 
    : 0;

  const projectedBalance = totalIncome - fixedExpenses - VARIABLE_GOAL;

  const chartData = expenseTransactions
    .reduce((acc, transaction) => {
      const dateStr = transaction.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const existingDay = acc.find(item => item.date === dateStr);
      const val = safeNumber(transaction.amount);
      if (existingDay) existingDay.amount += val;
      else acc.push({ date: dateStr, amount: val });
      return acc;
    }, [] as { date: string; amount: number }[]).slice(0, 7).reverse();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
           <AddTransactionDialog />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pode Gastar Hoje</CardTitle>
            <CalendarClock className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${dailyCap < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {formatCurrency(dailyCap)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dailyCap < 0 ? "Meta estourada!" : `Meta Variável Livre: ${formatCurrency(remainingVariableBudget)}`}
            </p>
          </CardContent>
        </Card>

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
              <Progress value={variableProgress} className={`h-2 ${variableProgress > 90 ? "bg-red-200" : ""}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentBalance < 0 ? "text-red-500" : ""}`}>
                {formatCurrency(currentBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Renda Total: {formatCurrency(totalIncome)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Previsão Sobra</CardTitle>
            <TrendingUp className={`h-4 w-4 ${projectedBalance >= 0 ? "text-green-500" : "text-red-500"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${projectedBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(projectedBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Se cumprir a meta e pagar fixos.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Histórico (Total)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {chartData.length > 0 ? <OverviewChart data={chartData} /> : <div className="h-[350px] flex items-center justify-center text-muted-foreground">Sem dados.</div>}
          </CardContent>
        </Card>

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
                {recentTransactions.length === 0 && <TableRow><TableCell colSpan={4} className="text-center">Vazio.</TableCell></TableRow>}
                {recentTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                        <div className="font-medium">{t.description}</div>
                        <div className="text-[10px] text-muted-foreground">{t.date.toLocaleDateString('pt-BR')}</div>
                    </TableCell>
                    <TableCell>
                        <span className={`px-2 py-1 rounded-full text-[10px] ${t.isFixed ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600'}`}>
                            {t.category} {t.isFixed && "(Fixo)"}
                        </span>
                    </TableCell>
                    <TableCell className={`text-right ${t.type === 'EXPENSE' ? 'text-red-500' : 'text-green-600'}`}>
                      {t.type === 'EXPENSE' ? '-' : '+'} {safeNumber(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell>
                      <TransactionActions transaction={{...t, amount: safeNumber(t.amount)}} />
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