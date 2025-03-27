import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AuthPage from "@/pages/auth-page";
import SharePage from "@/pages/SharePage";
import SharedFileView from "@/pages/SharedFileView";
import ProfilePage from "@/pages/ProfilePage";
import { FileContextProvider } from "@/context/FileContext";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { AdminProtectedRoute } from "@/lib/admin-protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/folder/:folderId" component={Home} />
      <ProtectedRoute path="/recent" component={Home} />
      <ProtectedRoute path="/shared" component={Home} />
      <ProtectedRoute path="/favorites" component={Home} />
      <ProtectedRoute path="/trash" component={Home} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      {/* Routes admin protégées */}
      <AdminProtectedRoute path="/admin" component={() => <div>Admin Dashboard</div>} />
      <AdminProtectedRoute path="/admin/users" component={() => <div>User Management</div>} />
      <Route path="/auth" component={AuthPage} />
      {/* Routes de partage publiques (non protégées) */}
      <Route path="/share/:token" component={SharePage} />
      <Route path="/share/:token/file/:fileId" component={SharedFileView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FileContextProvider>
          <Router />
          <Toaster />
        </FileContextProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
