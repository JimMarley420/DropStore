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
            <div className="mb-6 floating-element">
              <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                className="mx-auto"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="40" cy="40" r="38" stroke="url(#logo-gradient)" strokeWidth="4" />
                <path
                  d="M28 52L40 28L52 52H28Z"
                  stroke="url(#logo-gradient)"
                  strokeWidth="3"
                  fill="none"
                />
                <defs>
                  <linearGradient id="logo-gradient" x1="10" y1="10" x2="70" y2="70" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="gradient-heading text-3xl font-bold mb-2 text-glow">DropStore</h1>
            <p className="text-blue-300">Le futur du stockage en ligne est ici</p>
          </div>
          
          <Tabs 
            defaultValue="login" 
            value={tab}
            onValueChange={(value) => setTab(value as AuthTab)}
            className="glowing-border rounded-md p-1"
          >
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-900/40">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/30 data-[state=active]:to-indigo-600/30 data-[state=active]:text-blue-300"
              >
                Connexion
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/30 data-[state=active]:to-indigo-600/30 data-[state=active]:text-blue-300"
              >
                Inscription
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="hover-float">
              <LoginForm />
            </TabsContent>
            
            <TabsContent value="register" className="hover-float">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hero section */}
      <div className="hidden lg:flex lg:w-1/2 auth-hero-bg flex-col items-center justify-center text-white p-12 relative z-10">
        <div className="max-w-xl relative z-10 glowing-border-container p-8 rounded-xl bg-gray-900/20 backdrop-blur-sm">
          <div className="glowing-border"></div>
          <h1 className="text-4xl font-bold mb-6 gradient-heading text-glow">
            DropStore <span className="text-lg font-light text-blue-300 ml-2">v1.0</span>
          </h1>
          <h2 className="text-2xl font-semibold mb-6 text-blue-300">Interface futuriste. Performance ultra-rapide.</h2>
          
          <div className="relative my-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-md transform -rotate-1"></div>
            <p className="relative z-10 p-4 text-lg text-gray-100 bg-gray-900/60 backdrop-blur-sm rounded-md">
              Une solution de stockage en ligne de nouvelle génération pour tous vos documents, 
              photos, vidéos et plus encore.
            </p>
          </div>
          
          <ul className="space-y-4 relative mt-8">
            <div className="absolute h-full w-1 bg-gradient-to-b from-blue-500/40 to-indigo-500/40 left-[7px] top-1 rounded-full"></div>
            <li className="flex items-start pl-6 hover-float">
              <div className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 p-1 mr-3 mt-1">
                <CheckIcon className="h-4 w-4 text-black" />
              </div>
              <div>
                <span className="text-blue-300 font-medium">Stockage sécurisé</span>
                <p className="text-sm text-gray-300">Protection de niveau entreprise pour vos données</p>
              </div>
            </li>
            <li className="flex items-start pl-6 hover-float">
              <div className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 p-1 mr-3 mt-1">
                <CheckIcon className="h-4 w-4 text-black" />
              </div>
              <div>
                <span className="text-blue-300 font-medium">Partage intelligent</span>
                <p className="text-sm text-gray-300">Contrôlez qui peut voir et modifier vos fichiers</p>
              </div>
            </li>
            <li className="flex items-start pl-6 hover-float">
              <div className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 p-1 mr-3 mt-1">
                <CheckIcon className="h-4 w-4 text-black" />
              </div>
              <div>
                <span className="text-blue-300 font-medium">Multi-plateforme</span>
                <p className="text-sm text-gray-300">Accédez à vos fichiers depuis n'importe quel appareil</p>
              </div>
            </li>
            <li className="flex items-start pl-6 hover-float">
              <div className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 p-1 mr-3 mt-1">
                <CheckIcon className="h-4 w-4 text-black" />
              </div>
              <div>
                <span className="text-blue-300 font-medium">Synchronisation en temps réel</span>
                <p className="text-sm text-gray-300">Modifications instantanément reflétées partout</p>
              </div>
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