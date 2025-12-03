'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"

export async function updateSettings(formData: FormData) {
  // CORREÇÃO: Adicionado 'await'
  const { userId } = await auth();
  const userClerk = await currentUser();

  if (!userId || !userClerk) {
    throw new Error("Não autorizado");
  }

  let dbUser = await prisma.user.findUnique({ where: { clerkUserId: userId } })
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        clerkUserId: userId,
        email: userClerk.emailAddresses[0].emailAddress,
        name: userClerk.firstName,
      }
    })
  }

  const monthlyBudget = parseFloat(formData.get("monthlyBudget") as string)
  const monthlyIncome = parseFloat(formData.get("monthlyIncome") as string)
  
  await prisma.userSettings.upsert({
    where: { userId: dbUser.idString },
    update: {
      monthlyBudget,
      monthlyIncome
    },
    create: {
      userId: dbUser.idString,
      monthlyBudget,
      monthlyIncome
    }
  })

  revalidatePath("/") 
  revalidatePath("/settings")
  redirect("/")
}