/**
 * ====================================================================
 * MIDDLEWARE - Proteção de Rotas com Clerk
 * ====================================================================
 * Middleware que executa em TODAS as requisições da aplicação
 * Protege rotas privadas e redireciona usuários não autenticados
 * 
 * Rotas protegidas:
 * - / (dashboard principal)
 * - /settings (e todas as sub-rotas)
 * 
 * Rotas públicas (não protegidas):
 * - /sign-in
 * - /sign-up
 * - /ping
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Matcher de rotas protegidas
 * Define quais URLs requerem autenticação
 * 
 * Padrões:
 * - '/' -> Exatamente a raiz (dashboard)
 * - '/settings(.*)' -> /settings e todas as sub-rotas (regex)
 */
const isProtectedRoute = createRouteMatcher([
  '/',           // Dashboard principal
  '/settings(.*)' // Settings e sub-rotas
]);

/**
 * Middleware do Clerk com lógica customizada
 * Executa para cada requisição que corresponda ao matcher de configuração
 * 
 * @param auth - Função para verificar autenticação
 * @param req - Objeto da requisição HTTP
 */
export default clerkMiddleware(async (auth, req) => {
  // Verifica se a rota atual é protegida
  if (isProtectedRoute(req)) {
    // Aguarda resolução da autenticação
    const { userId, redirectToSignIn } = await auth();

    /**
     * Se não houver userId, usuário não está autenticado
     * Redireciona para página de login
     * 
     * Nota: Redirecionamento manual evita erro de tipagem com .protect()
     */
    if (!userId) {
      return redirectToSignIn();
    }
  }
  // Se rota não é protegida ou usuário está autenticado, continua normalmente
});

/**
 * ====================================================================
 * CONFIGURAÇÃO DO MIDDLEWARE
 * ====================================================================
 * Define em quais rotas o middleware deve executar
 * 
 * Por padrão, exclui arquivos estáticos e assets para performance
 */
export const config = {
  matcher: [
    /**
     * Matcher principal: Todas as rotas EXCETO:
     * - _next (arquivos internos do Next.js)
     * - Arquivos estáticos (imagens, CSS, JS, fonts, etc)
     * 
     * Regex complexo para excluir extensões comuns de arquivos estáticos
     */
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',

    /**
     * Matcher para rotas de API e tRPC
     * Garante que requisições de API também sejam protegidas
     */
    '/(api|trpc)(.*)',
  ],
};