import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { FileContextProvider } from "@/context/FileContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/folder/:folderId" component={Home} />
      <Route path="/recent" component={Home} />
      <Route path="/shared" component={Home} />
      <Route path="/favorites" component={Home} />
      <Route path="/trash" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FileContextProvider>
        <Router />
        <Toaster />
      </FileContextProvider>
    </QueryClientProvider>
  );
}

export default App;
