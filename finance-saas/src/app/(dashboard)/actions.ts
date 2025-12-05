'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth, currentUser } from "@clerk/nextjs/server"

async function getAuthenticatedUser() {
  // CORREÇÃO: Adicionado 'await'
  const { userId } = await auth()
  const userClerk = await currentUser()

  if (!userId || !userClerk) {
    throw new Error("Usuário não autenticado")
  }

  let dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId }
  })

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        clerkUserId: userId,
        email: userClerk.emailAddresses[0].emailAddress,
        name: userClerk.firstName + " " + userClerk.lastName,
      }
    })
  }

  return dbUser;
}

export async function createTransaction(formData: FormData) {
  const user = await getAuthenticatedUser();

  const description = formData.get("description") as string
  const amount = parseFloat(formData.get("amount") as string)
  const category = formData.get("category") as string
  const type = formData.get("type") as "INCOME" | "EXPENSE"
  const rawFixed = formData.get("isFixed");
  const isFixed = rawFixed === "on" || rawFixed === "true"; 

  if (!description || !amount || !category || !type) {
    throw new Error("Campos obrigatórios faltando")
  }

  await prisma.transaction.create({
    data: {
      userId: user.idString, 
      description,
      amount,
      category,
      type,
      isFixed,
      date: new Date(),
    },
  })

  revalidatePath("/")
}

export async function updateTransaction(formData: FormData) {
  const user = await getAuthenticatedUser();

  const id = formData.get("id") as string;
  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const category = formData.get("category") as string;
  const type = formData.get("type") as "INCOME" | "EXPENSE";
  const rawFixed = formData.get("isFixed");
  const isFixed = rawFixed === "on" || rawFixed === "true";

  if (!id || !description || !amount || !category || !type) {
    throw new Error("Dados inválidos");
  }

  await prisma.transaction.updateMany({
    where: { 
      id,
      userId: user.idString 
    },
    data: {
      description,
      amount,
      category,
      type,
      isFixed: isFixed as any,
    },
  });

  revalidatePath("/");
}

export async function deleteTransaction(id: string) {
  const user = await getAuthenticatedUser();

  await prisma.transaction.deleteMany({
    where: {
      id: id,
      userId: user.idString
    },
  });

  revalidatePath("/");
}