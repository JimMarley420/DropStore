import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerSchema, loginSchema } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

type AuthTab = "login" | "register";

export default function AuthPage() {
  const [tab, setTab] = useState<AuthTab>("login");
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  return (
    <div className="flex h-screen">
      {/* Authentication forms */}
      <div className="flex items-center justify-center w-full lg:w-1/2 gradient-card">
        <div className="max-w-md w-full px-4">
          <div className="mb-8 text-center">
            <h1 className="gradient-heading text-3xl font-bold mb-2">DropStore</h1>
            <p className="text-muted-foreground">Votre espace de stockage cloud sécurisé</p>
          </div>
          <Tabs defaultValue="login" value={tab} onValueChange={(value) => setTab(value as AuthTab)}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="register">Inscription</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            
            <TabsContent value="register">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hero section */}
      <div className="hidden lg:flex lg:w-1/2 auth-hero-bg flex-col items-center justify-center text-white p-12 relative z-10">
        <div className="max-w-xl relative z-10">
          <h1 className="text-4xl font-bold mb-6 gradient-heading">DropStore</h1>
          <h2 className="text-2xl font-semibold mb-4">Stockez, partagez et accédez à vos fichiers où que vous soyez</h2>
          <p className="mb-6 text-lg opacity-90">
            Une solution de stockage en ligne sécurisée et facile à utiliser pour tous vos documents, photos, vidéos et plus encore.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center">
              <CheckIcon className="mr-2 text-blue-400" /> Stockage sécurisé pour tous vos fichiers
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 text-blue-400" /> Partage facile avec vos amis et collègues
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 text-blue-400" /> Accès depuis n'importe quel appareil
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 text-blue-400" /> Sauvegarde automatique de vos données
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function LoginForm() {
  const { loginMutation } = useAuth();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(values);
  }

  return (
    <Card className="gradient-card border-gray-700/30 shadow-xl">
      <CardHeader>
        <CardTitle className="gradient-heading">Connexion</CardTitle>
        <CardDescription>
          Connectez-vous à votre compte DropStore
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom d'utilisateur</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Entrez votre nom d'utilisateur" 
                      className="bg-gray-800/50 border-gray-700/50"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="bg-gray-800/50 border-gray-700/50"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full gradient-button"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function RegisterForm() {
  const { registerMutation } = useAuth();
  
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
    },
  });

  function onSubmit(values: z.infer<typeof registerSchema>) {
    // Nous supprimons confirmPassword car il n'est pas attendu par le serveur
    const { confirmPassword, ...userData } = values;
    registerMutation.mutate(userData);
  }

  return (
    <Card className="gradient-card border-gray-700/30 shadow-xl">
      <CardHeader>
        <CardTitle className="gradient-heading">Inscription</CardTitle>
        <CardDescription>
          Créez un compte pour commencer à utiliser DropStore
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom d'utilisateur</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Choisissez un nom d'utilisateur" 
                      className="bg-gray-800/50 border-gray-700/50"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="votre@email.com" 
                      className="bg-gray-800/50 border-gray-700/50"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom complet</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Votre nom complet" 
                      className="bg-gray-800/50 border-gray-700/50"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="bg-gray-800/50 border-gray-700/50"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmer le mot de passe</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="bg-gray-800/50 border-gray-700/50"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full gradient-button" 
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                "S'inscrire"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}