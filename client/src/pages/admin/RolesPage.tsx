import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Lock,
  Check,
  X,
  Plus,
  Edit,
  Trash2,
  Save,
  Eye,
  FileText,
  User,
  UserPlus,
  Settings,
  HardDrive,
  Share2,
  Folder
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Types
interface RoleData {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: PermissionData[];
  userCount: number;
}

interface PermissionData {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  isAssigned?: boolean;
}

interface ResourceGroup {
  name: string;
  permissions: PermissionData[];
}

export default function RolesPage() {
  const [activeTab, setActiveTab] = useState('roles');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [isAddPermissionDialogOpen, setIsAddPermissionDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newPermissionName, setNewPermissionName] = useState('');
  const [newPermissionDescription, setNewPermissionDescription] = useState('');
  const [newPermissionResource, setNewPermissionResource] = useState('files');
  const [newPermissionAction, setNewPermissionAction] = useState('read');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Récupérer les rôles
  const { data: roles, isLoading: rolesLoading } = useQuery<RoleData[]>({
    queryKey: ['/api/admin/roles'],
    refetchOnWindowFocus: false,
  });

  // Récupérer les permissions
  const { data: permissions, isLoading: permissionsLoading } = useQuery<PermissionData[]>({
    queryKey: ['/api/admin/permissions'],
    refetchOnWindowFocus: false,
  });

  // Récupérer les détails d'un rôle
  const { data: roleDetails, isLoading: roleDetailsLoading } = useQuery<RoleData>({
    queryKey: ['/api/admin/roles', selectedRoleId],
    queryFn: async () => {
      if (!selectedRoleId) return null;
      const res = await fetch(`/api/admin/roles/${selectedRoleId}`);
      if (!res.ok) throw new Error('Erreur lors de la récupération des détails du rôle');
      return res.json();
    },
    enabled: !!selectedRoleId,
  });

  // Mutation pour créer un nouveau rôle
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: { name: string; description: string }) => {
      const res = await apiRequest('POST', '/api/admin/roles', roleData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Rôle créé',
        description: 'Le rôle a été créé avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
      setIsAddRoleDialogOpen(false);
      setNewRoleName('');
      setNewRoleDescription('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la création du rôle',
        variant: 'destructive',
      });
    },
  });

  // Mutation pour créer une nouvelle permission
  const createPermissionMutation = useMutation({
    mutationFn: async (permissionData: { 
      name: string; 
      description: string;
      resource: string;
      action: string;
    }) => {
      const res = await apiRequest('POST', '/api/admin/permissions', permissionData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Permission créée',
        description: 'La permission a été créée avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/permissions'] });
      setIsAddPermissionDialogOpen(false);
      setNewPermissionName('');
      setNewPermissionDescription('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la création de la permission',
        variant: 'destructive',
      });
    },
  });

  // Mutation pour mettre à jour les permissions d'un rôle
  const updateRolePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissionId, isAssigned }: { 
      roleId: string; 
      permissionId: string;
      isAssigned: boolean;
    }) => {
      if (isAssigned) {
        // Ajouter la permission au rôle
        const res = await apiRequest('POST', `/api/admin/roles/${roleId}/permissions`, { permissionId });
        return await res.json();
      } else {
        // Retirer la permission du rôle
        const res = await apiRequest('DELETE', `/api/admin/roles/${roleId}/permissions/${permissionId}`);
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles', selectedRoleId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la mise à jour des permissions',
        variant: 'destructive',
      });
    },
  });

  // Mutation pour supprimer un rôle
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const res = await apiRequest('DELETE', `/api/admin/roles/${roleId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Rôle supprimé',
        description: 'Le rôle a été supprimé avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
      setSelectedRoleId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la suppression du rôle',
        variant: 'destructive',
      });
    },
  });

  // Mutation pour supprimer une permission
  const deletePermissionMutation = useMutation({
    mutationFn: async (permissionId: string) => {
      const res = await apiRequest('DELETE', `/api/admin/permissions/${permissionId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Permission supprimée',
        description: 'La permission a été supprimée avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/permissions'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la suppression de la permission',
        variant: 'destructive',
      });
    },
  });

  // Créer un nouveau rôle
  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    createRoleMutation.mutate({
      name: newRoleName,
      description: newRoleDescription
    });
  };

  // Créer une nouvelle permission
  const handleCreatePermission = (e: React.FormEvent) => {
    e.preventDefault();
    createPermissionMutation.mutate({
      name: newPermissionName,
      description: newPermissionDescription,
      resource: newPermissionResource,
      action: newPermissionAction
    });
  };

  // Mettre à jour une permission de rôle
  const handleTogglePermission = (permissionId: string, isCurrentlyAssigned: boolean) => {
    if (!selectedRoleId) return;
    
    updateRolePermissionsMutation.mutate({
      roleId: selectedRoleId,
      permissionId,
      isAssigned: !isCurrentlyAssigned
    });
  };

  // Supprimer un rôle
  const handleDeleteRole = (roleId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      deleteRoleMutation.mutate(roleId);
    }
  };

  // Supprimer une permission
  const handleDeletePermission = (permissionId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette permission ?')) {
      deletePermissionMutation.mutate(permissionId);
    }
  };

  // Regrouper les permissions par ressource
  const getPermissionGroups = (): ResourceGroup[] => {
    if (!permissions) return [];

    const groups: Record<string, PermissionData[]> = {};
    
    permissions.forEach(permission => {
      if (!groups[permission.resource]) {
        groups[permission.resource] = [];
      }
      groups[permission.resource].push(permission);
    });

    return Object.keys(groups).map(resource => ({
      name: resource,
      permissions: groups[resource]
    }));
  };

  // Obtenir l'icône pour une ressource
  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'files':
        return <FileText className="h-4 w-4 text-blue-400" />;
      case 'users':
        return <User className="h-4 w-4 text-green-400" />;
      case 'folders':
        return <Folder className="h-4 w-4 text-yellow-400" />;
      case 'shares':
        return <Share2 className="h-4 w-4 text-purple-400" />;
      case 'storage':
        return <HardDrive className="h-4 w-4 text-red-400" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-400" />;
      default:
        return <Lock className="h-4 w-4 text-gray-400" />;
    }
  };

  // Obtenir la couleur pour un rôle
  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-500/20 text-red-500 border-red-700/30';
      case 'superadmin':
        return 'bg-purple-500/20 text-purple-500 border-purple-700/30';
      case 'moderator':
        return 'bg-blue-500/20 text-blue-500 border-blue-700/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-600/30';
    }
  };

  // Convertir la première lettre en majuscule
  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Affichage du chargement
  if ((rolesLoading && activeTab === 'roles') || (permissionsLoading && activeTab === 'permissions')) {
    return (
      <AdminLayout title="Rôles & Permissions" subtitle="Gestion des accès utilisateurs">
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-blue-600/20 mb-3 flex items-center justify-center">
              <Shield className="text-blue-500/50 animate-pulse" />
            </div>
            <div className="text-gray-400">Chargement des données...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Rôles & Permissions" subtitle="Gestion des accès utilisateurs">
      <Tabs value={activeTab} className="space-y-6" onValueChange={setActiveTab}>
        <div className="border-b border-gray-800/60 pb-2">
          <TabsList className="bg-gray-800/40">
            <TabsTrigger value="roles" className="data-[state=active]:bg-blue-500/10">
              <Shield className="h-4 w-4 mr-2" />
              Rôles
            </TabsTrigger>
            <TabsTrigger value="permissions" className="data-[state=active]:bg-blue-500/10">
              <Lock className="h-4 w-4 mr-2" />
              Permissions
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Onglet des Rôles */}
        <TabsContent value="roles" className="space-y-6">
          <div className="flex justify-end">
            <Button 
              className="gradient-button" 
              onClick={() => setIsAddRoleDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau rôle
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Card className="bg-gray-800/20 border-gray-700/50 shadow-lg">
                <CardHeader>
                  <CardTitle>Liste des rôles</CardTitle>
                  <CardDescription>
                    Sélectionnez un rôle pour gérer ses permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {roles?.map((role) => (
                      <div
                        key={role.id}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          selectedRoleId === role.id
                            ? 'bg-blue-900/30 border border-blue-700/50'
                            : 'bg-gray-800/40 border border-gray-700/30 hover:bg-gray-800/70'
                        }`}
                        onClick={() => setSelectedRoleId(role.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Shield className={
                              selectedRoleId === role.id
                                ? 'text-blue-400'
                                : 'text-gray-500'
                            } />
                            <div>
                              <div className="font-medium text-white">{role.name}</div>
                              <div className="text-xs text-gray-400">
                                {role.userCount} utilisateur{role.userCount !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={role.isSystem ? 'bg-blue-900/20 text-blue-400 border-blue-700/30' : ''}
                          >
                            {role.isSystem ? 'Système' : 'Personnalisé'}
                          </Badge>
                        </div>
                      </div>
                    ))}

                    {(!roles || roles.length === 0) && (
                      <div className="text-center py-6 text-gray-400">
                        Aucun rôle disponible
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {selectedRoleId && roleDetails ? (
                <Card className="bg-gray-800/20 border-gray-700/50 shadow-lg">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <CardTitle>{roleDetails.name}</CardTitle>
                          <Badge 
                            variant="outline" 
                            className={getRoleBadgeColor(roleDetails.name)}
                          >
                            {roleDetails.userCount} utilisateur{roleDetails.userCount !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <CardDescription>
                          {roleDetails.description || 'Aucune description disponible'}
                        </CardDescription>
                      </div>

                      {!roleDetails.isSystem && (
                        <div className="mt-4 md:mt-0 flex space-x-2">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteRole(roleDetails.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-2">
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-300 mb-2">Permissions</h3>
                      <p className="text-xs text-gray-400 mb-4">
                        Cochez les permissions que vous souhaitez accorder à ce rôle.
                        {roleDetails.isSystem && (
                          <span className="text-yellow-400 ml-1">
                            Attention : modifier un rôle système peut affecter le fonctionnement de l'application.
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Groupes de permissions */}
                    <Accordion type="multiple" className="border rounded-md border-gray-700/50 divide-y divide-gray-700/50">
                      {getPermissionGroups().map((group) => (
                        <AccordionItem
                          key={group.name}
                          value={group.name}
                          className="border-b-0 last:border-0"
                        >
                          <AccordionTrigger className="px-4 py-3 hover:bg-gray-800/30 hover:no-underline">
                            <div className="flex items-center">
                              {getResourceIcon(group.name)}
                              <span className="ml-2 capitalize">{group.name}</span>
                              <Badge className="ml-2 bg-gray-700/50" variant="secondary">
                                {group.permissions.length}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-3 pt-0">
                            <div className="space-y-2">
                              {group.permissions.map((permission) => {
                                const isAssigned = roleDetails.permissions.some(
                                  p => p.id === permission.id
                                );
                                
                                return (
                                  <div
                                    key={permission.id}
                                    className="flex items-center justify-between p-2 rounded-md bg-gray-900/30"
                                  >
                                    <div>
                                      <div className="flex items-center">
                                        <span className="text-sm font-medium text-gray-200">
                                          {permission.name}
                                        </span>
                                        <Badge 
                                          className="ml-2 text-xs capitalize" 
                                          variant="outline"
                                        >
                                          {permission.action}
                                        </Badge>
                                      </div>
                                      {permission.description && (
                                        <p className="text-xs text-gray-400 mt-1">
                                          {permission.description}
                                        </p>
                                      )}
                                    </div>
                                    <Switch
                                      checked={isAssigned}
                                      onCheckedChange={() => handleTogglePermission(permission.id, isAssigned)}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex items-center justify-center min-h-[400px] bg-gray-800/20 border border-gray-700/50 rounded-lg">
                  <div className="text-center">
                    <Shield className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-300">
                      Aucun rôle sélectionné
                    </h3>
                    <p className="mt-2 text-sm text-gray-400">
                      Veuillez sélectionner un rôle dans la liste pour voir ses détails et gérer ses permissions.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Onglet des Permissions */}
        <TabsContent value="permissions" className="space-y-6">
          <div className="flex justify-end">
            <Button 
              className="gradient-button" 
              onClick={() => setIsAddPermissionDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle permission
            </Button>
          </div>

          <Card className="bg-gray-800/20 border-gray-700/50 shadow-lg">
            <CardHeader>
              <CardTitle>Liste des permissions</CardTitle>
              <CardDescription>
                Toutes les permissions disponibles dans le système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-gray-700/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-800/50">
                    <TableRow>
                      <TableHead className="text-gray-300 font-medium">Permission</TableHead>
                      <TableHead className="text-gray-300 font-medium">Ressource</TableHead>
                      <TableHead className="text-gray-300 font-medium">Action</TableHead>
                      <TableHead className="text-gray-300 font-medium">Description</TableHead>
                      <TableHead className="text-gray-300 font-medium w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions?.map((permission) => (
                      <TableRow key={permission.id} className="border-gray-700/30 hover:bg-gray-800/30">
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <Lock className="h-4 w-4 text-blue-400" />
                            <span>{permission.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize bg-gray-800/70">
                            {getResourceIcon(permission.resource)}
                            <span className="ml-1">{permission.resource}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`capitalize ${
                              permission.action === 'read' 
                                ? 'bg-blue-900/20 text-blue-400 border-blue-700/30'
                                : permission.action === 'write' 
                                ? 'bg-green-900/20 text-green-400 border-green-700/30'
                                : permission.action === 'delete' 
                                ? 'bg-red-900/20 text-red-400 border-red-700/30'
                                : 'bg-purple-900/20 text-purple-400 border-purple-700/30'
                            }`}
                          >
                            {permission.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400 max-w-[300px] truncate">
                          {permission.description || 'Aucune description'}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-400"
                            onClick={() => handleDeletePermission(permission.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                    {(!permissions || permissions.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                          Aucune permission disponible
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogue d'ajout de rôle */}
      <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau rôle</DialogTitle>
            <DialogDescription>
              Créez un nouveau rôle avec des permissions personnalisées
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateRole}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="role-name">Nom du rôle</Label>
                <Input
                  id="role-name"
                  placeholder="Ex: Gestionnaire de contenu"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="bg-gray-900/50 border-gray-700 text-white"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role-description">Description</Label>
                <Textarea
                  id="role-description"
                  placeholder="Décrivez les responsabilités et permissions de ce rôle"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="bg-gray-900/50 border-gray-700 text-white min-h-[100px]"
                />
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddRoleDialogOpen(false)}
                className="text-gray-300 hover:text-white border-gray-700"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={!newRoleName || createRoleMutation.isPending}
                className="gradient-button"
              >
                {createRoleMutation.isPending ? 'Création...' : 'Créer le rôle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogue d'ajout de permission */}
      <Dialog open={isAddPermissionDialogOpen} onOpenChange={setIsAddPermissionDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une nouvelle permission</DialogTitle>
            <DialogDescription>
              Créez une nouvelle permission pour contrôler l'accès aux ressources
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreatePermission}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="permission-name">Nom de la permission</Label>
                <Input
                  id="permission-name"
                  placeholder="Ex: Lire les fichiers"
                  value={newPermissionName}
                  onChange={(e) => setNewPermissionName(e.target.value)}
                  className="bg-gray-900/50 border-gray-700 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="permission-resource">Ressource</Label>
                  <Select 
                    value={newPermissionResource} 
                    onValueChange={setNewPermissionResource}
                  >
                    <SelectTrigger id="permission-resource" className="bg-gray-900/50 border-gray-700 text-white">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="files">Fichiers</SelectItem>
                      <SelectItem value="folders">Dossiers</SelectItem>
                      <SelectItem value="users">Utilisateurs</SelectItem>
                      <SelectItem value="shares">Partages</SelectItem>
                      <SelectItem value="storage">Stockage</SelectItem>
                      <SelectItem value="system">Système</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permission-action">Action</Label>
                  <Select 
                    value={newPermissionAction} 
                    onValueChange={setNewPermissionAction}
                  >
                    <SelectTrigger id="permission-action" className="bg-gray-900/50 border-gray-700 text-white">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="read">Lecture</SelectItem>
                      <SelectItem value="write">Écriture</SelectItem>
                      <SelectItem value="delete">Suppression</SelectItem>
                      <SelectItem value="manage">Gestion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="permission-description">Description</Label>
                <Textarea
                  id="permission-description"
                  placeholder="Décrivez ce que cette permission permet de faire"
                  value={newPermissionDescription}
                  onChange={(e) => setNewPermissionDescription(e.target.value)}
                  className="bg-gray-900/50 border-gray-700 text-white min-h-[100px]"
                />
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddPermissionDialogOpen(false)}
                className="text-gray-300 hover:text-white border-gray-700"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={!newPermissionName || createPermissionMutation.isPending}
                className="gradient-button"
              >
                {createPermissionMutation.isPending ? 'Création...' : 'Créer la permission'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}