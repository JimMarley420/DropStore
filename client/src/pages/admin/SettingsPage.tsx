import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Save,
  RefreshCw,
  Database,
  HardDrive,
  Mail,
  Shield,
  Upload,
  Download,
  Clock,
  Trash2,
  Globe,
  FileText,
  BarChart2,
  AlertCircle,
  Info,
  Server
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatBytes } from './AdminDashboard';

// Types
interface SystemSettings {
  storage: {
    maxUserStorageGB: number;
    maxFileSize: number;
    allowedFileTypes: string[];
    autoDeleteInactiveFiles: boolean;
    inactiveFileDays: number;
  };
  security: {
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSymbols: boolean;
    maxLoginAttempts: number;
    sessionTimeout: number;
    forceHttps: boolean;
    enableTwoFactor: boolean;
  };
  email: {
    enableEmailNotifications: boolean;
    emailServer: string;
    emailPort: number;
    emailUser: string;
    emailFrom: string;
    emailFooter: string;
  };
  sharing: {
    enablePublicSharing: boolean;
    allowExternalRegistration: boolean;
    defaultExpirationDays: number;
    enablePasswordProtection: boolean;
    requireEmailForSharing: boolean;
  };
  system: {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    debugMode: boolean;
    analyticsEnabled: boolean;
    showStorageWarnings: boolean;
    storageWarningThreshold: number;
  };
}

interface SystemStatus {
  serverVersion: string;
  serverUptime: string;
  databaseStatus: {
    status: string;
    connection: string;
    migrations: number;
    size: number;
  };
  cacheStatus: {
    status: string;
    items: number;
    hitRate: number;
    size: number;
  };
  storageStatus: {
    total: number;
    used: number;
    free: number;
  };
  jobQueue: {
    pending: number;
    processing: number;
    failed: number;
    completed: number;
  };
  lastBackup: string;
  memoryUsage: number;
  cpuUsage: number;
}

interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  lastRun: string | null;
  status: 'running' | 'idle' | 'failed' | 'completed';
  progress?: number;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [backupDescription, setBackupDescription] = useState('');
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Récupérer les paramètres du système
  const { data: settings, isLoading: settingsLoading } = useQuery<SystemSettings>({
    queryKey: ['/api/admin/settings'],
    refetchOnWindowFocus: false,
  });

  // Récupérer le statut du système
  const { data: systemStatus, isLoading: statusLoading } = useQuery<SystemStatus>({
    queryKey: ['/api/admin/system/status'],
    refetchOnWindowFocus: false,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Récupérer les tâches de maintenance
  const { data: maintenanceTasks, isLoading: tasksLoading } = useQuery<MaintenanceTask[]>({
    queryKey: ['/api/admin/system/maintenance'],
    refetchOnWindowFocus: false,
  });

  // Mutation pour mettre à jour les paramètres
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<SystemSettings>) => {
      const res = await apiRequest('PATCH', '/api/admin/settings', updatedSettings);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Paramètres mis à jour',
        description: 'Les paramètres ont été enregistrés avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la mise à jour des paramètres',
        variant: 'destructive',
      });
    },
  });

  // Mutation pour lancer une tâche de maintenance
  const runMaintenanceTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await apiRequest('POST', `/api/admin/system/maintenance/${taskId}/run`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Tâche lancée',
        description: 'La tâche de maintenance a été lancée avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system/maintenance'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors du lancement de la tâche',
        variant: 'destructive',
      });
    },
  });

  // Mutation pour créer une sauvegarde
  const createBackupMutation = useMutation({
    mutationFn: async (data: { description: string }) => {
      const res = await apiRequest('POST', '/api/admin/system/backup', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Sauvegarde créée',
        description: 'La sauvegarde a été créée avec succès',
      });
      setIsBackupDialogOpen(false);
      setBackupDescription('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la création de la sauvegarde',
        variant: 'destructive',
      });
    },
  });

  // Mutation pour restaurer une sauvegarde
  const restoreBackupMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/admin/system/restore', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Sauvegarde restaurée',
        description: 'La sauvegarde a été restaurée avec succès',
      });
      setIsRestoreDialogOpen(false);
      setSelectedBackupFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la restauration de la sauvegarde',
        variant: 'destructive',
      });
    },
  });

  // Mettre à jour les paramètres du système
  const updateSettings = (sectionKey: keyof SystemSettings, settings: any) => {
    const updatedSettings = {
      [sectionKey]: settings
    };
    
    updateSettingsMutation.mutate(updatedSettings as Partial<SystemSettings>);
  };

  // Lancer une tâche de maintenance
  const runMaintenanceTask = (taskId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir lancer cette tâche de maintenance ?')) {
      runMaintenanceTaskMutation.mutate(taskId);
    }
  };

  // Créer une sauvegarde
  const createBackup = (e: React.FormEvent) => {
    e.preventDefault();
    createBackupMutation.mutate({ description: backupDescription });
  };

  // Restaurer une sauvegarde
  const restoreBackup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBackupFile) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier de sauvegarde',
        variant: 'destructive',
      });
      return;
    }
    
    if (!window.confirm('La restauration d\'une sauvegarde remplacera toutes les données actuelles. Êtes-vous sûr de vouloir continuer ?')) {
      return;
    }
    
    const formData = new FormData();
    formData.append('backup', selectedBackupFile);
    
    restoreBackupMutation.mutate(formData);
  };

  // Affichage du chargement
  if (settingsLoading) {
    return (
      <AdminLayout title="Paramètres" subtitle="Configuration du système">
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-blue-600/20 mb-3 flex items-center justify-center">
              <Settings className="text-blue-500/50 animate-pulse" />
            </div>
            <div className="text-gray-400">Chargement des paramètres...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Paramètres" subtitle="Configuration du système">
      <Tabs value={activeTab} className="space-y-6" onValueChange={setActiveTab}>
        <div className="border-b border-gray-800/60 pb-2">
          <TabsList className="bg-gray-800/40">
            <TabsTrigger value="general" className="data-[state=active]:bg-blue-500/10">
              <Settings className="h-4 w-4 mr-2" />
              Général
            </TabsTrigger>
            <TabsTrigger value="storage" className="data-[state=active]:bg-blue-500/10">
              <HardDrive className="h-4 w-4 mr-2" />
              Stockage
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-blue-500/10">
              <Shield className="h-4 w-4 mr-2" />
              Sécurité
            </TabsTrigger>
            <TabsTrigger value="status" className="data-[state=active]:bg-blue-500/10">
              <BarChart2 className="h-4 w-4 mr-2" />
              Statut
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="data-[state=active]:bg-blue-500/10">
              <RefreshCw className="h-4 w-4 mr-2" />
              Maintenance
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Onglet Général */}
        <TabsContent value="general" className="space-y-6">
          <Card className="bg-gray-800/20 border-gray-700/50 shadow-lg">
            <CardHeader>
              <CardTitle>Paramètres généraux</CardTitle>
              <CardDescription>
                Configuration générale de l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="site-name">Nom du site</Label>
                        <Input
                          id="site-name"
                          value={settings.system.siteName}
                          onChange={(e) => {
                            const updatedSettings = { 
                              ...settings.system,
                              siteName: e.target.value
                            };
                            updateSettings('system', updatedSettings);
                          }}
                          className="bg-gray-900/50 border-gray-700 text-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="site-description">Description</Label>
                        <Textarea
                          id="site-description"
                          value={settings.system.siteDescription}
                          onChange={(e) => {
                            const updatedSettings = { 
                              ...settings.system,
                              siteDescription: e.target.value
                            };
                            updateSettings('system', updatedSettings);
                          }}
                          className="bg-gray-900/50 border-gray-700 text-white min-h-[100px]"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label>Mode maintenance</Label>
                          <p className="text-xs text-gray-400">
                            Activer/désactiver le mode maintenance
                          </p>
                        </div>
                        <Switch
                          checked={settings.system.maintenanceMode}
                          onCheckedChange={(checked) => {
                            const updatedSettings = { 
                              ...settings.system,
                              maintenanceMode: checked
                            };
                            updateSettings('system', updatedSettings);
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label>Mode débogage</Label>
                          <p className="text-xs text-gray-400">
                            Activer les logs détaillés pour le débogage
                          </p>
                        </div>
                        <Switch
                          checked={settings.system.debugMode}
                          onCheckedChange={(checked) => {
                            const updatedSettings = { 
                              ...settings.system,
                              debugMode: checked
                            };
                            updateSettings('system', updatedSettings);
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label>Statistiques</Label>
                          <p className="text-xs text-gray-400">
                            Collecter des statistiques d'utilisation anonymes
                          </p>
                        </div>
                        <Switch
                          checked={settings.system.analyticsEnabled}
                          onCheckedChange={(checked) => {
                            const updatedSettings = { 
                              ...settings.system,
                              analyticsEnabled: checked
                            };
                            updateSettings('system', updatedSettings);
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label>Alertes de stockage</Label>
                          <p className="text-xs text-gray-400">
                            Afficher des notifications lorsque le stockage est presque plein
                          </p>
                        </div>
                        <Switch
                          checked={settings.system.showStorageWarnings}
                          onCheckedChange={(checked) => {
                            const updatedSettings = { 
                              ...settings.system,
                              showStorageWarnings: checked
                            };
                            updateSettings('system', updatedSettings);
                          }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="warning-threshold">Seuil d'alerte de stockage (%)</Label>
                        <Input
                          id="warning-threshold"
                          type="number"
                          min="1"
                          max="99"
                          value={settings.system.storageWarningThreshold}
                          onChange={(e) => {
                            const updatedSettings = { 
                              ...settings.system,
                              storageWarningThreshold: parseInt(e.target.value) || 0
                            };
                            updateSettings('system', updatedSettings);
                          }}
                          className="bg-gray-900/50 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800/20 border-gray-700/50 shadow-lg">
            <CardHeader>
              <CardTitle>Paramètres email</CardTitle>
              <CardDescription>
                Configuration des notifications emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings && (
                <>
                  <div className="flex items-center justify-between space-x-2 mb-6">
                    <div className="space-y-0.5">
                      <Label className="text-base">Notifications email</Label>
                      <p className="text-sm text-gray-400">
                        Activer/désactiver l'envoi de notifications par email
                      </p>
                    </div>
                    <Switch
                      checked={settings.email.enableEmailNotifications}
                      onCheckedChange={(checked) => {
                        const updatedSettings = { 
                          ...settings.email,
                          enableEmailNotifications: checked
                        };
                        updateSettings('email', updatedSettings);
                      }}
                    />
                  </div>

                  <Collapsible
                    open={settings.email.enableEmailNotifications}
                    className="space-y-4"
                  >
                    <CollapsibleContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="email-server">Serveur SMTP</Label>
                            <Input
                              id="email-server"
                              value={settings.email.emailServer}
                              onChange={(e) => {
                                const updatedSettings = { 
                                  ...settings.email,
                                  emailServer: e.target.value
                                };
                                updateSettings('email', updatedSettings);
                              }}
                              className="bg-gray-900/50 border-gray-700 text-white"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="email-port">Port SMTP</Label>
                            <Input
                              id="email-port"
                              type="number"
                              value={settings.email.emailPort}
                              onChange={(e) => {
                                const updatedSettings = { 
                                  ...settings.email,
                                  emailPort: parseInt(e.target.value) || 0
                                };
                                updateSettings('email', updatedSettings);
                              }}
                              className="bg-gray-900/50 border-gray-700 text-white"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="email-user">Utilisateur SMTP</Label>
                            <Input
                              id="email-user"
                              value={settings.email.emailUser}
                              onChange={(e) => {
                                const updatedSettings = { 
                                  ...settings.email,
                                  emailUser: e.target.value
                                };
                                updateSettings('email', updatedSettings);
                              }}
                              className="bg-gray-900/50 border-gray-700 text-white"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="email-from">Adresse d'expéditeur</Label>
                            <Input
                              id="email-from"
                              type="email"
                              value={settings.email.emailFrom}
                              onChange={(e) => {
                                const updatedSettings = { 
                                  ...settings.email,
                                  emailFrom: e.target.value
                                };
                                updateSettings('email', updatedSettings);
                              }}
                              className="bg-gray-900/50 border-gray-700 text-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email-footer">Pied de page des emails</Label>
                        <Textarea
                          id="email-footer"
                          value={settings.email.emailFooter}
                          onChange={(e) => {
                            const updatedSettings = { 
                              ...settings.email,
                              emailFooter: e.target.value
                            };
                            updateSettings('email', updatedSettings);
                          }}
                          className="bg-gray-900/50 border-gray-700 text-white min-h-[100px]"
                        />
                        <p className="text-xs text-gray-400">
                          Ce texte sera ajouté au bas de tous les emails envoyés par le système
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800/20 border-gray-700/50 shadow-lg">
            <CardHeader>
              <CardTitle>Paramètres de partage</CardTitle>
              <CardDescription>
                Configuration des options de partage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label>Partage public</Label>
                          <p className="text-xs text-gray-400">
                            Autoriser le partage de fichiers par lien public
                          </p>
                        </div>
                        <Switch
                          checked={settings.sharing.enablePublicSharing}
                          onCheckedChange={(checked) => {
                            const updatedSettings = { 
                              ...settings.sharing,
                              enablePublicSharing: checked
                            };
                            updateSettings('sharing', updatedSettings);
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label>Inscription externe</Label>
                          <p className="text-xs text-gray-400">
                            Autoriser les nouveaux utilisateurs à s'inscrire
                          </p>
                        </div>
                        <Switch
                          checked={settings.sharing.allowExternalRegistration}
                          onCheckedChange={(checked) => {
                            const updatedSettings = { 
                              ...settings.sharing,
                              allowExternalRegistration: checked
                            };
                            updateSettings('sharing', updatedSettings);
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label>Protection par mot de passe</Label>
                          <p className="text-xs text-gray-400">
                            Activer la protection par mot de passe pour les partages
                          </p>
                        </div>
                        <Switch
                          checked={settings.sharing.enablePasswordProtection}
                          onCheckedChange={(checked) => {
                            const updatedSettings = { 
                              ...settings.sharing,
                              enablePasswordProtection: checked
                            };
                            updateSettings('sharing', updatedSettings);
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label>Email obligatoire</Label>
                          <p className="text-xs text-gray-400">
                            Demander une adresse email pour accéder aux partages
                          </p>
                        </div>
                        <Switch
                          checked={settings.sharing.requireEmailForSharing}
                          onCheckedChange={(checked) => {
                            const updatedSettings = { 
                              ...settings.sharing,
                              requireEmailForSharing: checked
                            };
                            updateSettings('sharing', updatedSettings);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="default-expiration">Expiration par défaut (jours)</Label>
                      <Input
                        id="default-expiration"
                        type="number"
                        min="0"
                        value={settings.sharing.defaultExpirationDays}
                        onChange={(e) => {
                          const updatedSettings = { 
                            ...settings.sharing,
                            defaultExpirationDays: parseInt(e.target.value) || 0
                          };
                          updateSettings('sharing', updatedSettings);
                        }}
                        className="bg-gray-900/50 border-gray-700 text-white"
                      />
                      <p className="text-xs text-gray-400">
                        Durée par défaut avant l'expiration des liens de partage (0 = illimité)
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Stockage */}
        <TabsContent value="storage" className="space-y-6">
          <Card className="bg-gray-800/20 border-gray-700/50 shadow-lg">
            <CardHeader>
              <CardTitle>Limites de stockage</CardTitle>
              <CardDescription>
                Configuration des limites de stockage pour les utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="max-storage">Espace de stockage par utilisateur (GB)</Label>
                        <Input
                          id="max-storage"
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={settings.storage.maxUserStorageGB}
                          onChange={(e) => {
                            const updatedSettings = { 
                              ...settings.storage,
                              maxUserStorageGB: parseFloat(e.target.value) || 0
                            };
                            updateSettings('storage', updatedSettings);
                          }}
                          className="bg-gray-900/50 border-gray-700 text-white"
                        />
                        <p className="text-xs text-gray-400">
                          Limite d'espace de stockage accordée à chaque utilisateur
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="max-file-size">Taille maximale des fichiers (MB)</Label>
                        <Input
                          id="max-file-size"
                          type="number"
                          min="1"
                          value={settings.storage.maxFileSize / (1024 * 1024)}
                          onChange={(e) => {
                            const updatedSettings = { 
                              ...settings.storage,
                              maxFileSize: (parseFloat(e.target.value) || 0) * 1024 * 1024
                            };
                            updateSettings('storage', updatedSettings);
                          }}
                          className="bg-gray-900/50 border-gray-700 text-white"
                        />
                        <p className="text-xs text-gray-400">
                          Taille maximale autorisée pour les fichiers téléchargés
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label>Suppression automatique</Label>
                          <p className="text-xs text-gray-400">
                            Supprimer automatiquement les fichiers inactifs
                          </p>
                        </div>
                        <Switch
                          checked={settings.storage.autoDeleteInactiveFiles}
                          onCheckedChange={(checked) => {
                            const updatedSettings = { 
                              ...settings.storage,
                              autoDeleteInactiveFiles: checked
                            };
                            updateSettings('storage', updatedSettings);
                          }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="inactive-days">Période d'inactivité (jours)</Label>
                        <Input
                          id="inactive-days"
                          type="number"
                          min="1"
                          value={settings.storage.inactiveFileDays}
                          onChange={(e) => {
                            const updatedSettings = { 
                              ...settings.storage,
                              inactiveFileDays: parseInt(e.target.value) || 0
                            };
                            updateSettings('storage', updatedSettings);
                          }}
                          className="bg-gray-900/50 border-gray-700 text-white"
                          disabled={!settings.storage.autoDeleteInactiveFiles}
                        />
                        <p className="text-xs text-gray-400">
                          Nombre de jours après lesquels un fichier est considéré comme inactif
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6 bg-gray-700/50" />

                  <div className="space-y-4">
                    <Label>Types de fichiers autorisés</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { value: 'image/*', label: 'Images', checked: settings.storage.allowedFileTypes.includes('image/*') },
                        { value: 'video/*', label: 'Vidéos', checked: settings.storage.allowedFileTypes.includes('video/*') },
                        { value: 'audio/*', label: 'Audio', checked: settings.storage.allowedFileTypes.includes('audio/*') },
                        { value: 'application/pdf', label: 'PDF', checked: settings.storage.allowedFileTypes.includes('application/pdf') },
                        { value: 'text/*', label: 'Texte', checked: settings.storage.allowedFileTypes.includes('text/*') },
                        { value: 'application/msword', label: 'Documents Office', checked: settings.storage.allowedFileTypes.includes('application/msword') },
                        { value: 'application/zip', label: 'Archives', checked: settings.storage.allowedFileTypes.includes('application/zip') },
                        { value: 'application/json', label: 'JSON', checked: settings.storage.allowedFileTypes.includes('application/json') },
                      ].map((type) => (
                        <div className="flex items-center space-x-2 p-3 border border-gray-700/50 rounded-md" key={type.value}>
                          <Checkbox
                            id={`file-type-${type.value}`}
                            checked={type.checked}
                            onCheckedChange={(checked) => {
                              let allowedTypes = [...settings.storage.allowedFileTypes];
                              
                              if (checked) {
                                if (!allowedTypes.includes(type.value)) {
                                  allowedTypes.push(type.value);
                                }
                              } else {
                                allowedTypes = allowedTypes.filter(t => t !== type.value);
                              }
                              
                              const updatedSettings = { 
                                ...settings.storage,
                                allowedFileTypes: allowedTypes
                              };
                              updateSettings('storage', updatedSettings);
                            }}
                          />
                          <Label
                            htmlFor={`file-type-${type.value}`}
                            className="text-sm cursor-pointer"
                          >
                            {type.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Sécurité */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-gray-800/20 border-gray-700/50 shadow-lg">
            <CardHeader>
              <CardTitle>Paramètres de sécurité</CardTitle>
              <CardDescription>
                Configuration des règles de sécurité et d'authentification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="min-password-length">Longueur minimale du mot de passe</Label>
                        <Input
                          id="min-password-length"
                          type="number"
                          min="6"
                          value={settings.security.passwordMinLength}
                          onChange={(e) => {
                            const updatedSettings = { 
                              ...settings.security,
                              passwordMinLength: parseInt(e.target.value) || 0
                            };
                            updateSettings('security', updatedSettings);
                          }}
                          className="bg-gray-900/50 border-gray-700 text-white"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label>Exiger des majuscules</Label>
                          <p className="text-xs text-gray-400">
                            Exiger au moins une lettre majuscule dans les mots de passe
                          </p>
                        </div>
                        <Switch
                          checked={settings.security.passwordRequireUppercase}
                          onCheckedChange={(checked) => {
                            const updatedSettings = { 
                              ...settings.security,
                              passwordRequireUppercase: checked
                            };
                            updateSettings('security', updatedSettings);
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label>Exiger des chiffres</Label>
                          <p className="text-xs text-gray-400">
                            Exiger au moins un chiffre dans les mots de passe
                          </p>
                        </div>
                        <Switch
                          checked={settings.security.passwordRequireNumbers}
                          onCheckedChange={(checked) => {
                            const updatedSettings = { 
                              ...settings.security,
                              passwordRequireNumbers: checked
                            };
                            updateSettings('security', updatedSettings);
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label>Exiger des symboles</Label>
                          <p className="text-xs text-gray-400">
                            Exiger au moins un caractère spécial dans les mots de passe
                          </p>
                        </div>
                        <Switch
                          checked={settings.security.passwordRequireSymbols}
                          onCheckedChange={(checked) => {
                            const updatedSettings = { 
                              ...settings.security,
                              passwordRequireSymbols: checked
                            };
                            updateSettings('security', updatedSettings);
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="max-login-attempts">Tentatives de connexion maximales</Label>
                        <Input
                          id="max-login-attempts"
                          type="number"
                          min="1"
                          value={settings.security.maxLoginAttempts}
                          onChange={(e) => {
                            const updatedSettings = { 
                              ...settings.security,
                              maxLoginAttempts: parseInt(e.target.value) || 0
                            };
                            updateSettings('security', updatedSettings);
                          }}
                          className="bg-gray-900/50 border-gray-700 text-white"
                        />
                        <p className="text-xs text-gray-400">
                          Nombre de tentatives infructueuses avant le verrouillage du compte
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="session-timeout">Expiration de session (minutes)</Label>
                        <Input
                          id="session-timeout"
                          type="number"
                          min="1"
                          value={settings.security.sessionTimeout}
                          onChange={(e) => {
                            const updatedSettings = { 
                              ...settings.security,
                              sessionTimeout: parseInt(e.target.value) || 0
                            };
                            updateSettings('security', updatedSettings);
                          }}
                          className="bg-gray-900/50 border-gray-700 text-white"
                        />
                        <p className="text-xs text-gray-400">
                          Durée avant l'expiration automatique des sessions inactives
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label>Forcer HTTPS</Label>
                          <p className="text-xs text-gray-400">
                            Rediriger automatiquement HTTP vers HTTPS
                          </p>
                        </div>
                        <Switch
                          checked={settings.security.forceHttps}
                          onCheckedChange={(checked) => {
                            const updatedSettings = { 
                              ...settings.security,
                              forceHttps: checked
                            };
                            updateSettings('security', updatedSettings);
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label>Authentification à deux facteurs</Label>
                          <p className="text-xs text-gray-400">
                            Activer l'authentification à deux facteurs (2FA) pour les utilisateurs
                          </p>
                        </div>
                        <Switch
                          checked={settings.security.enableTwoFactor}
                          onCheckedChange={(checked) => {
                            const updatedSettings = { 
                              ...settings.security,
                              enableTwoFactor: checked
                            };
                            updateSettings('security', updatedSettings);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Statut */}
        <TabsContent value="status" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-gray-800/20 border-gray-700/50 shadow-lg">
              <CardHeader>
                <CardTitle>Statut du système</CardTitle>
                <CardDescription>
                  Informations sur l'état du serveur et des services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {statusLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <RefreshCw className="animate-spin text-blue-500 h-8 w-8" />
                  </div>
                ) : systemStatus ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400">Version du serveur</p>
                        <p className="text-sm font-medium">{systemStatus.serverVersion}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400">Temps de fonctionnement</p>
                        <p className="text-sm font-medium">{systemStatus.serverUptime}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400">Statut de la base de données</p>
                        <div className="flex items-center">
                          <Badge 
                            variant="outline" 
                            className={systemStatus.databaseStatus.status === 'connected'
                              ? 'bg-green-900/20 text-green-400 border-green-700/30'
                              : 'bg-red-900/20 text-red-400 border-red-700/30'
                            }
                          >
                            {systemStatus.databaseStatus.status === 'connected' ? 'Connectée' : 'Déconnectée'}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400">Taille de la base de données</p>
                        <p className="text-sm font-medium">{formatBytes(systemStatus.databaseStatus.size)}</p>
                      </div>
                    </div>

                    <Separator className="my-4 bg-gray-700/50" />

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <p className="text-sm">Utilisation du stockage</p>
                          <p className="text-xs text-gray-400">
                            {formatBytes(systemStatus.storageStatus.used)} / {formatBytes(systemStatus.storageStatus.total)}
                          </p>
                        </div>
                        <Progress 
                          value={(systemStatus.storageStatus.used / systemStatus.storageStatus.total) * 100} 
                          className="h-2 bg-gray-700"
                          indicatorClassName="bg-gradient-to-r from-blue-600 to-purple-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <p className="text-sm">Utilisation mémoire</p>
                          <p className="text-xs text-gray-400">{systemStatus.memoryUsage}%</p>
                        </div>
                        <Progress 
                          value={systemStatus.memoryUsage} 
                          className="h-2 bg-gray-700"
                          indicatorClassName={`${
                            systemStatus.memoryUsage > 80
                              ? 'bg-red-500'
                              : systemStatus.memoryUsage > 60
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <p className="text-sm">Utilisation CPU</p>
                          <p className="text-xs text-gray-400">{systemStatus.cpuUsage}%</p>
                        </div>
                        <Progress 
                          value={systemStatus.cpuUsage} 
                          className="h-2 bg-gray-700"
                          indicatorClassName={`${
                            systemStatus.cpuUsage > 80
                              ? 'bg-red-500'
                              : systemStatus.cpuUsage > 60
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                        />
                      </div>
                    </div>

                    <Separator className="my-4 bg-gray-700/50" />

                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Files d'attente des tâches</h3>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="rounded-md bg-gray-900/50 p-3 text-center">
                          <p className="text-lg font-bold">{systemStatus.jobQueue.pending}</p>
                          <p className="text-xs text-gray-400">En attente</p>
                        </div>
                        <div className="rounded-md bg-gray-900/50 p-3 text-center">
                          <p className="text-lg font-bold">{systemStatus.jobQueue.processing}</p>
                          <p className="text-xs text-gray-400">En cours</p>
                        </div>
                        <div className="rounded-md bg-gray-900/50 p-3 text-center">
                          <p className="text-lg font-bold">{systemStatus.jobQueue.completed}</p>
                          <p className="text-xs text-gray-400">Terminées</p>
                        </div>
                        <div className="rounded-md bg-gray-900/50 p-3 text-center">
                          <p className="text-lg font-bold">{systemStatus.jobQueue.failed}</p>
                          <p className="text-xs text-gray-400">Échouées</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    Impossible de charger le statut du système
                  </div>
                )}
              </CardContent>
              {systemStatus && (
                <CardFooter className="border-t border-gray-700/50 pt-4">
                  <div className="w-full flex justify-between items-center">
                    <div className="text-sm text-gray-400">
                      Dernière sauvegarde: {systemStatus.lastBackup}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-300 hover:text-white border-gray-700"
                      onClick={() => setIsBackupDialogOpen(true)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>

            <Card className="bg-gray-800/20 border-gray-700/50 shadow-lg">
              <CardHeader>
                <CardTitle>Logs du système</CardTitle>
                <CardDescription>
                  Logs et notifications récentes du système
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] overflow-y-auto rounded-md border border-gray-700/50 bg-gray-900/30 p-4 font-mono text-xs">
                  <div className="space-y-2">
                    <div className="text-green-400">[2023-07-10 14:35:22] INFO: Server started successfully</div>
                    <div className="text-green-400">[2023-07-10 14:35:23] INFO: Connected to database</div>
                    <div className="text-green-400">[2023-07-10 14:36:01] INFO: User authentication successful (user_id: 42)</div>
                    <div className="text-blue-400">[2023-07-10 14:36:45] NOTICE: File upload completed (user_id: 42, file_id: 1234)</div>
                    <div className="text-blue-400">[2023-07-10 14:38:12] NOTICE: Share link created (user_id: 42, file_id: 1234)</div>
                    <div className="text-yellow-400">[2023-07-10 14:40:03] WARNING: User approaching storage limit (user_id: 42, usage: 95%)</div>
                    <div className="text-green-400">[2023-07-10 14:42:10] INFO: User logout (user_id: 42)</div>
                    <div className="text-green-400">[2023-07-10 14:50:22] INFO: Maintenance task started: clean_temp_files</div>
                    <div className="text-green-400">[2023-07-10 14:51:45] INFO: Maintenance task completed: clean_temp_files (removed: 12 files)</div>
                    <div className="text-green-400">[2023-07-10 15:00:00] INFO: Scheduled backup started</div>
                    <div className="text-green-400">[2023-07-10 15:01:30] INFO: Backup completed successfully (size: 45.2 MB)</div>
                    <div className="text-red-400">[2023-07-10 15:10:12] ERROR: Failed to process file upload (user_id: 13, reason: exceeded file size limit)</div>
                    <div className="text-red-400">[2023-07-10 15:15:33] ERROR: Failed login attempt (username: admin, ip: 192.168.1.100)</div>
                    <div className="text-red-400">[2023-07-10 15:15:45] ERROR: Failed login attempt (username: admin, ip: 192.168.1.100)</div>
                    <div className="text-red-400">[2023-07-10 15:15:57] ERROR: Multiple failed login attempts detected (username: admin) - account temporarily locked</div>
                    <div className="text-yellow-400">[2023-07-10 15:30:22] WARNING: High CPU usage detected (92%)</div>
                    <div className="text-yellow-400">[2023-07-10 15:31:15] WARNING: System resources under pressure (memory usage: 87%)</div>
                    <div className="text-green-400">[2023-07-10 15:35:40] INFO: System resource usage returned to normal levels</div>
                    <div className="text-green-400">[2023-07-10 16:00:00] INFO: Daily maintenance tasks started</div>
                    <div className="text-blue-400">[2023-07-10 16:01:23] NOTICE: Removed 25 expired share links</div>
                    <div className="text-green-400">[2023-07-10 16:02:45] INFO: Daily maintenance tasks completed</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-700/50 pt-4">
                <div className="w-full flex justify-between items-center">
                  <div className="text-sm text-gray-400">
                    Affichage des 20 dernières entrées
                  </div>
                  <Button variant="outline" size="sm" className="text-gray-300 hover:text-white border-gray-700">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger logs
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Maintenance */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card className="bg-gray-800/20 border-gray-700/50 shadow-lg">
            <CardHeader>
              <CardTitle>Tâches de maintenance</CardTitle>
              <CardDescription>
                Exécuter des tâches de maintenance sur le système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-800">
                {tasksLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="animate-spin text-blue-500 h-8 w-8" />
                  </div>
                ) : maintenanceTasks ? (
                  maintenanceTasks.map((task) => (
                    <div key={task.id} className="py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <div>
                          <h3 className="text-base font-medium">{task.name}</h3>
                          <p className="text-sm text-gray-400">{task.description}</p>
                        </div>
                        <div className="mt-3 sm:mt-0">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={task.status === 'running'}
                            onClick={() => runMaintenanceTask(task.id)}
                            className="text-blue-400 hover:text-blue-300 border-blue-800/40 hover:bg-blue-900/20"
                          >
                            {task.status === 'running' ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                En cours...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Exécuter
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-3">
                        <Badge variant="outline" className={
                          task.status === 'completed'
                            ? 'bg-green-900/20 text-green-400 border-green-700/30'
                            : task.status === 'failed'
                            ? 'bg-red-900/20 text-red-400 border-red-700/30'
                            : task.status === 'running'
                            ? 'bg-blue-900/20 text-blue-400 border-blue-700/30'
                            : 'bg-gray-900/20 text-gray-400 border-gray-700/30'
                        }>
                          {task.status}
                        </Badge>
                        
                        {task.lastRun && (
                          <span className="text-xs text-gray-400">
                            Dernière exécution: {new Date(task.lastRun).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {task.status === 'running' && task.progress !== undefined && (
                        <div className="mt-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-400">Progression</span>
                            <span className="text-xs text-gray-400">{task.progress}%</span>
                          </div>
                          <Progress 
                            value={task.progress} 
                            className="h-2 bg-gray-700"
                            indicatorClassName="bg-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    Aucune tâche de maintenance disponible
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/20 border-gray-700/50 shadow-lg">
            <CardHeader>
              <CardTitle>Sauvegarde et restauration</CardTitle>
              <CardDescription>
                Sauvegarder et restaurer les données du système
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="p-4 border border-gray-700/50 rounded-lg bg-gray-900/30">
                  <div className="flex items-center mb-4">
                    <Download className="h-6 w-6 text-blue-400 mr-3" />
                    <h3 className="text-lg font-medium">Sauvegarde</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    Créez une sauvegarde complète de toutes les données du système. Cette sauvegarde comprend les fichiers des utilisateurs, la base de données et les paramètres de configuration.
                  </p>
                  <Button 
                    onClick={() => setIsBackupDialogOpen(true)}
                    className="w-full gradient-button"
                  >
                    Créer une sauvegarde
                  </Button>
                </div>

                <div className="p-4 border border-gray-700/50 rounded-lg bg-gray-900/30">
                  <div className="flex items-center mb-4">
                    <Upload className="h-6 w-6 text-purple-400 mr-3" />
                    <h3 className="text-lg font-medium">Restauration</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    Restaurez le système à partir d'une sauvegarde précédente. Attention : cette action remplacera toutes les données actuelles du système.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => setIsRestoreDialogOpen(true)}
                    className="w-full border-purple-800/40 text-purple-400 hover:bg-purple-900/20"
                  >
                    Restaurer une sauvegarde
                  </Button>
                </div>
              </div>

              <div className="p-4 border border-yellow-700/30 rounded-lg bg-yellow-900/10">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-400">Important</h4>
                    <p className="text-xs text-gray-300 mt-1">
                      Les sauvegardes sont essentielles pour prévenir la perte de données. Nous recommandons de créer 
                      des sauvegardes régulières et de les stocker dans un emplacement sécurisé. Les sauvegardes automatiques 
                      sont configurées pour s'exécuter tous les jours à minuit.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogue de sauvegarde */}
      <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer une sauvegarde</DialogTitle>
            <DialogDescription>
              Créez une sauvegarde complète du système
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={createBackup}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="backup-description">Description</Label>
                <Textarea
                  id="backup-description"
                  placeholder="Description optionnelle pour identifier cette sauvegarde"
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  className="bg-gray-900/50 border-gray-700 text-white min-h-[100px]"
                />
              </div>
              
              <div className="p-3 bg-blue-900/20 border border-blue-800/30 rounded-md">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-300">
                    Cette sauvegarde inclura tous les fichiers des utilisateurs, la base de données et les paramètres du système. Cette opération peut prendre plusieurs minutes selon la taille des données.
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsBackupDialogOpen(false)}
                className="text-gray-300 hover:text-white border-gray-700"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={createBackupMutation.isPending}
                className="gradient-button"
              >
                {createBackupMutation.isPending ? 'Création...' : 'Créer la sauvegarde'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogue de restauration */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restaurer une sauvegarde</DialogTitle>
            <DialogDescription>
              Restaurez le système à partir d'une sauvegarde
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={restoreBackup}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="backup-file">Fichier de sauvegarde</Label>
                <Input
                  id="backup-file"
                  type="file"
                  accept=".zip,.backup"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setSelectedBackupFile(e.target.files[0]);
                    }
                  }}
                  className="bg-gray-900/50 border-gray-700 text-white"
                />
              </div>
              
              <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300">
                    <strong>Attention :</strong> La restauration écrasera toutes les données actuelles. 
                    Cette action ne peut pas être annulée. Assurez-vous d'avoir une sauvegarde récente 
                    avant de procéder.
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsRestoreDialogOpen(false)}
                className="text-gray-300 hover:text-white border-gray-700"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={!selectedBackupFile || restoreBackupMutation.isPending}
                variant="destructive"
              >
                {restoreBackupMutation.isPending ? 'Restauration...' : 'Restaurer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}