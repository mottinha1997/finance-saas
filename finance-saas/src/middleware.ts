import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Protege a raiz e qualquer rota dentro de /settings
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
  // Omatcher abaixo ignora arquivos estáticos (_next, imagens, etc)
  // Isso evita que o Clerk bloqueie o carregamento do próprio site
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};