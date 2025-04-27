import { useAuth, useIsAdmin, useHasRole } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

// Route protégée pour les administrateurs
export function AdminProtectedRoute({
  path,
  component: Component,
  requiredRole = ["admin", "superadmin"],
}: {
  path: string;
  component: () => React.JSX.Element;
  requiredRole?: string | string[];
}) {
  const { user, isLoading } = useAuth();
  const isAdmin = useIsAdmin();
  const hasRequiredRole = useHasRole(requiredRole);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (!hasRequiredRole) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-6 text-center">
          <div className="rounded-lg bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 p-8 shadow-lg max-w-xl">
            <h1 className="text-3xl font-bold gradient-heading mb-4">Accès refusé</h1>
            <p className="text-gray-300 mb-6">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
              Cette section est réservée aux administrateurs.
            </p>
            <a 
              href="/" 
              className="gradient-button rounded-md px-4 py-2 text-sm hover-float"
            >
              Retourner à l'accueil
            </a>
          </div>
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}