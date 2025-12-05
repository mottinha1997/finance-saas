/**
 * ====================================================================
 * PÁGINA DE CONFIGURAÇÕES
 * ====================================================================
 * Permite usuário configurar metas e orçamentos financeiros
 * 
 * Configurações disponíveis:
 * - Renda Mensal Estimada: Para cálculo de previsão de sobra
 * - Meta de Gastos Variáveis: Define limite diário de gastos
 * 
 * Impacto no Dashboard:
 * - monthlyBudget → Define o card "Pode Gastar Hoje"
 * - monthlyIncome → Usado na "Previsão de Sobra"
 */

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
  // ====================================================================
  // AUTENTICAÇÃO E BUSCA DE DADOS
  // ====================================================================

  // Busca ID do usuário autenticado
  const { userId } = await auth();

  // Busca usuário no banco de dados
  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId || "" }
  });

  // Busca configurações existentes do usuário
  const settings = dbUser ? await prisma.userSettings.findUnique({
    where: { userId: dbUser.idString }
  }) : null;

  // ====================================================================
  // RENDERIZAÇÃO
  // ====================================================================

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

          {/* 
            Formulário com Server Action
            updateSettings será chamada ao submeter
          */}
          <form action={updateSettings}>
            <CardContent className="space-y-4">

              {/* ============================================================
                  CAMPO 1: RENDA MENSAL ESTIMADA
                  Usada no cálculo de "Previsão de Sobra"
                  ============================================================ */}
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

              {/* ============================================================
                  CAMPO 2: META DE GASTOS VARIÁVEIS
                  Define o limite mensal e calcula "Pode Gastar Hoje"
                  ============================================================ */}
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

            {/* Botão de submit */}
            <CardFooter>
              <Button type="submit">Salvar Alterações</Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}