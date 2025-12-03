import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define quais rotas são protegidas
const isProtectedRoute = createRouteMatcher([
  '/', 
  '/settings(.*)' 
]);

// Note o 'async' aqui antes dos parâmetros
export default clerkMiddleware(async (auth, req) => {
  // Se for rota protegida, esperamos a autenticação resolver com 'await'
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};