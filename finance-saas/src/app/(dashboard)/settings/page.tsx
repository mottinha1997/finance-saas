import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateSettings } from "./actions"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export default async function SettingsPage() {
  // CORREÇÃO: Adicionado 'await'
  const { userId } = await auth();

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId || "" }
  });

  const settings = dbUser ? await prisma.userSettings.findUnique({
    where: { userId: dbUser.idString }
  }) : null;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
      
      <div className="grid gap-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Definições de Orçamento</CardTitle>
            <CardDescription>
              Esses valores baseiam os cálculos de previsão e meta diária.
            </CardDescription>
          </CardHeader>
          
          <form action={updateSettings}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyIncome">Renda Mensal Estimada (Total)</Label>
                <Input 
                  id="monthlyIncome" 
                  name="monthlyIncome" 
                  type="number" 
                  step="0.01" 
                  placeholder="Ex: 5000.00" 
                  defaultValue={settings?.monthlyIncome?.toString()}
                />
                <p className="text-[0.8rem] text-muted-foreground">
                   Soma do seu salário + extras. Usado para calcular a previsão de sobra.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="monthlyBudget">Meta de Gastos Variáveis (Seu limite)</Label>
                <Input 
                  id="monthlyBudget" 
                  name="monthlyBudget" 
                  type="number" 
                  step="0.01" 
                  placeholder="Ex: 1500.00" 
                  defaultValue={settings?.monthlyBudget?.toString()}
                  required
                />
                <p className="text-[0.8rem] text-muted-foreground">
                  Defina quanto você quer gastar com Mercado, Lazer, etc (após pagar as contas fixas).
                  <strong> Esse valor define seu "Pode Gastar Hoje".</strong>
                </p>
              </div>

            </CardContent>
            <CardFooter>
              <Button type="submit">Salvar Alterações</Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}