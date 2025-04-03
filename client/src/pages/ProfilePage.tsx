import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { updateProfileSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, User, Mail, ImagePlus, LogOut, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { formatBytes } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Link, useLocation } from "wouter";

const formSchema = updateProfileSchema.extend({
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.password && !data.confirmPassword) return false;
  if (!data.password && data.confirmPassword) return false;
  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) return false;
  return true;
}, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [, setLocation] = useLocation();

  // Get user storage stats
  const { data: storageData, isLoading: storageLoading } = useQuery<{ used: number; total: number }>({
    queryKey: ["/api/user/storage"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Form for profile editing
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user?.email || "",
      fullName: user?.fullName || "",
      password: "",
      confirmPassword: "",
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to upload avatar");
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
      setSelectedFile(null);
      toast({
        title: "Avatar mis à jour",
        description: "Votre photo de profil a été mise à jour avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour de l'avatar",
        variant: "destructive",
      });
    },
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Supprime les champs de mot de passe si vides
      const dataToSend = { ...data };
      if (!dataToSend.password) {
        delete dataToSend.password;
        delete dataToSend.confirmPassword;
      }
      
      // Supprime confirmPassword car il n'est pas dans le schéma du backend
      delete dataToSend.confirmPassword;

      const res = await apiRequest("PATCH", "/api/user/profile", dataToSend);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour du profil",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Calcul des statistiques utilisateur
  const storagePercentage = storageData
    ? Math.round((storageData.used / storageData.total) * 100)
    : 0;

  // Obtenir les initiales de l'utilisateur
  const getInitials = () => {
    if (!user) return "?";
    if (user.fullName) {
      return user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  // Date d'inscription formatée
  const formattedJoinDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Non disponible';

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-10">
      {/* Header */}
      <header className="border-b border-gray-700/30 gradient-card rounded-none shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/">
            <div className="flex items-center hover-float cursor-pointer">
              <div className="text-blue-400 text-3xl mr-2">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d="M12 2L20 8V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V8L12 2Z" 
                    stroke="url(#logo-gradient)" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M16 14C16 15.0609 15.5786 16.0783 14.8284 16.8284C14.0783 17.5786 13.0609 18 12 18C10.9391 18 9.92172 17.5786 9.17157 16.8284C8.42143 16.0783 8 15.0609 8 14" 
                    stroke="url(#logo-gradient)" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <defs>
                    <linearGradient id="logo-gradient" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#3b82f6" />
                      <stop offset="1" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h1 className="text-xl font-bold gradient-heading text-glow">DropStore</h1>
            </div>
          </Link>

          <div className="flex items-center">
            <div>
              <button 
                onClick={() => setLocation("/")}
                className="inline-flex items-center py-1.5 px-3 text-sm rounded-md text-gray-300 hover:bg-gray-800/40"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Retour</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6 max-w-3xl">
        <h1 className="text-3xl font-bold text-white mb-6 gradient-heading">
          Votre profil
        </h1>

        {/* Profile Card */}
        <Card className="border-gray-700/50 bg-gray-800/90 backdrop-blur-sm shadow-lg hover-float">
          <CardHeader className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative group">
              <Avatar className="w-32 h-32 glowing-border">
                <AvatarImage 
                  src={`${user.avatarUrl || ""}?${new Date().getTime()}`} 
                  alt={user.username} 
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-2xl text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute inset-0 flex items-center justify-center rounded-full cursor-pointer bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ImagePlus className="h-8 w-8 text-white" />
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        uploadAvatarMutation.mutate(e.target.files[0]);
                      }
                    }} 
                  />
                </label>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <CardTitle className="text-2xl font-bold text-white">
                {user.fullName || user.username}
              </CardTitle>
              <CardDescription className="text-gray-400 mt-1">
                {user.username}
                {user.role !== 'user' && (
                  <span className="ml-2 text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">
                    {user.role}
                  </span>
                )}
              </CardDescription>
              
              <div className="flex flex-col sm:flex-row gap-2 mt-4 text-sm text-gray-300">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  {user.email}
                </div>
                <div className="hidden sm:flex items-center">
                  <span className="mx-2 text-gray-600">•</span>
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  Compte créé le {formattedJoinDate}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            <Separator className="bg-gray-700/50" />
            
            {/* Storage Usage */}
            <div className="space-y-2">
              <Label className="text-gray-300">Espace de stockage</Label>
              <div className="flex items-center gap-2">
                <Progress 
                  value={storagePercentage} 
                  className="h-2 flex-1 bg-gray-700/50"
                  indicatorClassName="gradient-progress"
                />
                <span className="text-sm text-gray-400 whitespace-nowrap">
                  {storageLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    `${formatBytes(storageData?.used || 0)} / ${formatBytes(storageData?.total || 0)}`
                  )}
                </span>
              </div>
            </div>

            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Nom complet</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Votre nom complet" 
                            {...field} 
                            value={field.value || ''}
                            className="bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-gray-500"
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
                        <FormLabel className="text-gray-300">Adresse e-mail</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="exemple@email.com" 
                            {...field}
                            className="bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-gray-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-2">
                    <div className="text-gray-300 text-sm font-semibold mb-2">Modifier le mot de passe</div>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Nouveau mot de passe</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Nouveau mot de passe" 
                                {...field}
                                className="bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-gray-500"
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
                            <FormLabel className="text-gray-300">Confirmer le mot de passe</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Confirmer le mot de passe" 
                                {...field}
                                className="bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-gray-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      className="gradient-button"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Save className="mr-2 h-4 w-4" /> Enregistrer
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400 text-sm">Nom complet</Label>
                    <div className="text-white font-medium mt-1">{user.fullName || "Non défini"}</div>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Nom d'utilisateur</Label>
                    <div className="text-white font-medium mt-1">{user.username}</div>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Email</Label>
                    <div className="text-white font-medium mt-1">{user.email}</div>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Date d'inscription</Label>
                    <div className="text-white font-medium mt-1">{formattedJoinDate}</div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    className="border-red-900/30 bg-red-950/20 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </Button>
                  <Button 
                    className="gradient-button"
                    onClick={() => setIsEditing(true)}
                  >
                    Modifier le profil
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Section */}
        <Card className="border-gray-700/50 bg-gray-800/90 backdrop-blur-sm shadow-lg hover-float">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Statistiques et activité</CardTitle>
            <CardDescription className="text-gray-400">
              Votre historique d'utilisation et statistiques
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-900/40 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{user.storageUsed > 0 ? Math.ceil(user.storageUsed / 1024 / 1024) : 0}</div>
                <div className="text-sm text-gray-400">Fichiers stockés (MB)</div>
              </div>
              <div className="bg-gray-900/40 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-sm text-gray-400">Fichiers partagés</div>
              </div>
              <div className="bg-gray-900/40 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-sm text-gray-400">Téléchargements</div>
              </div>
            </div>

            {/* Dernières activités - à intégrer plus tard avec un back-end qui stocke les actions utilisateur */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-white mb-3">Dernières activités</h3>
              <div className="bg-gray-900/30 rounded-lg p-4 text-center">
                <p className="text-gray-400">Historique des activités à venir</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}