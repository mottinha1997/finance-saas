import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define as rotas que queremos proteger
const isProtectedRoute = createRouteMatcher([
  '/',
  '/settings(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    // 1. Aguardamos a autenticação resolver (async/await)
    const { userId, redirectToSignIn } = await auth();

    // 2. Se não tiver ID de usuário, redirecionamos para login manualmente
    // Isso evita o erro de tipagem no método .protect()
    if (!userId) {
      return redirectToSignIn();
    }
  }
});

export const config = {
  matcher: [
    // Matcher padrão para não bloquear arquivos estáticos
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};