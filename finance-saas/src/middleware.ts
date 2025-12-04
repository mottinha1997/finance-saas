import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Protegendo APENAS a rota settings e a raiz por enquanto
const isProtectedRoute = createRouteMatcher([
  '/',
  '/settings(.*)'
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    // Matcher padrão do Clerk que evita bloquear arquivos estáticos
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};