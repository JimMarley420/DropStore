import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Shield, 
  User, 
  UserCheck, 
  UserX, 
  Mail, 
  Info, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Edit,
  HardDrive
} from 'lucide-react';

import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { formatBytes } from './AdminDashboard';
import { apiRequest } from '@/lib/queryClient';

// Types
interface User {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  storageUsed: number;
  storageLimit: number;
  createdAt: string;
  lastLoginAt: string | null;
  avatarUrl: string | null;
}

interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface UserActionPayload {
  action: 'activate' | 'deactivate' | 'resetPassword' | 'updateRole' | 'updateStorage';
  data?: {
    role?: string;
    storageLimit?: number;
  };
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('');
  const [newStorageLimit, setNewStorageLimit] = useState<number>(0);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Récupérer la liste des utilisateurs
  const { data, isLoading, error } = useQuery<UserListResponse>({
    queryKey: ['/api/admin/users', searchQuery, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      params.append('page', currentPage.toString());
      
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error('Erreur lors de la récupération des utilisateurs');
      return res.json();
    },
  });
  
  // Mutation pour effectuer des actions sur les utilisateurs
  const userActionMutation = useMutation({
    mutationFn: async (payload: { userId: number, data: UserActionPayload }) => {
      const { userId, data: actionData } = payload;
      const res = await apiRequest('POST', `/api/admin/users/${userId}/actions`, actionData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Action réussie',
        description: 'L\'action a été effectuée avec succès.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsActionDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    },
  });
  
  // Récupérer les détails d'un utilisateur
  const { data: userDetails, isLoading: isLoadingDetails } = useQuery<User>({
    queryKey: ['/api/admin/users', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      const res = await fetch(`/api/admin/users/${selectedUserId}`);
      if (!res.ok) throw new Error('Erreur lors de la récupération des détails de l\'utilisateur');
      return res.json();
    },
    enabled: !!selectedUserId,
  });
  
  // Traitement de la soumission du formulaire de recherche
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };
  
  // Ouvrir la boîte de dialogue d'action pour un utilisateur
  const openActionDialog = (user: User, action: string) => {
    setSelectedUser(user);
    setActionType(action);
    if (action === 'change_role') {
      setNewRole(user.role);
    } else if (action === 'update_storage') {
      setNewStorageLimit(user.storageLimit);
    }
    setIsActionDialogOpen(true);
  };
  
  // Effectuer l'action sur l'utilisateur
  const performAction = () => {
    if (!selectedUser) return;
    
    // Adaptation des noms d'actions aux valeurs attendues par le backend
    let action: UserActionPayload['action'];
    switch(actionType) {
      case 'change_role':
        action = 'updateRole';
        break;
      case 'update_storage':
        action = 'updateStorage';
        break;
      case 'reset_password':
        action = 'resetPassword';
        break;
      default:
        action = actionType as UserActionPayload['action'];
    }
    
    const actionPayload: UserActionPayload = { action };
    
    // Configuration des données supplémentaires en fonction de l'action
    if (actionType === 'change_role' && newRole) {
      actionPayload.data = { role: newRole };
    } else if (actionType === 'update_storage' && newStorageLimit > 0) {
      actionPayload.data = { storageLimit: newStorageLimit };
    }
    
    userActionMutation.mutate({
      userId: selectedUser.id,
      data: actionPayload,
    });
  };
  
  // Calcul du pourcentage de stockage utilisé
  const getStoragePercentage = (used: number, limit: number) => {
    return Math.min(100, (used / limit) * 100);
  };
  
  // Obtenir la couleur du badge pour un rôle
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
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
  
  // Affichage d'un état de chargement
  if (isLoading) {
    return (
      <AdminLayout title="Utilisateurs" subtitle="Gestion des utilisateurs">
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-blue-600/20 mb-3 flex items-center justify-center">
              <User className="text-blue-500/50 animate-pulse" />
            </div>
            <div className="text-gray-400">Chargement des utilisateurs...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  // Affichage d'une erreur
  if (error) {
    return (
      <AdminLayout title="Utilisateurs" subtitle="Gestion des utilisateurs">
        <div className="flex items-center justify-center py-10">
          <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-6 max-w-md">
            <div className="flex items-center text-red-500 mb-3">
              <XCircle className="mr-2" size={20} />
              <h3 className="font-semibold">Erreur de chargement</h3>
            </div>
            <p className="text-gray-300">
              Une erreur est survenue lors du chargement des utilisateurs.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Détail: {error instanceof Error ? error.message : "Erreur inconnue"}
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title="Utilisateurs" subtitle="Gestion des comptes utilisateurs">
      {/* En-tête avec barre de recherche */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold gradient-text">
            {data?.total || 0} utilisateurs enregistrés
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Gérez les utilisateurs, les rôles et les permissions
          </p>
        </div>
        
        <form onSubmit={handleSearch} className="flex w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Rechercher un utilisateur..."
              className="pl-9 bg-gray-800/40 border-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit" className="ml-2">
            Rechercher
          </Button>
        </form>
      </div>
      
      {/* Tableau des utilisateurs */}
      <Card className="bg-gray-800/20 border-gray-700/50 shadow-xl">
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>
            Utilisateurs par nom, email, rôle et statut
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-700/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-800/50">
                <TableRow>
                  <TableHead className="text-gray-300 font-medium">Utilisateur</TableHead>
                  <TableHead className="text-gray-300 font-medium">Rôle</TableHead>
                  <TableHead className="text-gray-300 font-medium">Statut</TableHead>
                  <TableHead className="text-gray-300 font-medium">Stockage</TableHead>
                  <TableHead className="text-gray-300 font-medium w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.users.map((user) => (
                  <TableRow 
                    key={user.id}
                    className="border-gray-700/30 hover:bg-gray-800/30"
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            <User size={20} className="text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{user.fullName || user.username}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Badge variant="outline" className={`${getRoleBadgeStyle(user.role)}`}>
                          <Shield className="mr-1 h-3 w-3" />
                          {user.role}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <div className="flex items-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-gray-200">Actif</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-gray-500 mr-2"></div>
                          <span className="text-gray-400">Inactif</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <HardDrive className="h-4 w-4 text-gray-500 mr-2" />
                        <div className="w-full max-w-[100px]">
                          <div className="text-xs text-gray-400 mb-1 flex justify-between">
                            <span>{formatBytes(user.storageUsed)}</span>
                            <span>{formatBytes(user.storageLimit)}</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500" 
                              style={{ width: `${getStoragePercentage(user.storageUsed, user.storageLimit)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 px-2 border-gray-700 hover:bg-gray-700/30"
                          onClick={() => setSelectedUserId(user.id)}
                        >
                          <Info size={16} className="text-blue-400" />
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 px-2 border-gray-700 hover:bg-gray-700/30"
                          onClick={() => openActionDialog(user, 'change_role')}
                        >
                          <Shield size={16} className="text-purple-400" />
                        </Button>
                        
                        {user.isActive ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 px-2 border-gray-700 hover:bg-gray-700/30"
                            onClick={() => openActionDialog(user, 'deactivate')}
                          >
                            <UserX size={16} className="text-orange-400" />
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 px-2 border-gray-700 hover:bg-gray-700/30"
                            onClick={() => openActionDialog(user, 'activate')}
                          >
                            <UserCheck size={16} className="text-green-400" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* S'il n'y a pas d'utilisateurs */}
                {(!data?.users || data.users.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <CardFooter className="flex items-center justify-between border-t border-gray-700/30 pt-4">
            <div className="text-sm text-gray-400">
              Page {data.page} sur {data.totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={data.page === 1}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(data.totalPages, prev + 1))}
                disabled={data.page === data.totalPages}
              >
                Suivant
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
      
      {/* Dialogue de détails d'utilisateur */}
      {selectedUserId && (
        <Dialog open={!!selectedUserId} onOpenChange={() => setSelectedUserId(null)}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Détails de l'utilisateur</DialogTitle>
              <DialogDescription>
                Informations complètes sur l'utilisateur
              </DialogDescription>
            </DialogHeader>
            
            {isLoadingDetails ? (
              <div className="flex justify-center py-6">
                <div className="animate-pulse text-blue-400">Chargement...</div>
              </div>
            ) : userDetails ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                    {userDetails.avatarUrl ? (
                      <img src={userDetails.avatarUrl} alt={userDetails.username} className="w-full h-full object-cover" />
                    ) : (
                      <User size={28} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{userDetails.fullName || userDetails.username}</h3>
                    <div className="flex items-center mt-1">
                      <Badge variant="outline" className={`${getRoleBadgeStyle(userDetails.role)}`}>
                        <Shield className="mr-1 h-3 w-3" />
                        {userDetails.role}
                      </Badge>
                      
                      {userDetails.isActive ? (
                        <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-500 border-green-700/30">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="ml-2 bg-gray-500/10 text-gray-400 border-gray-700/30">
                          <XCircle className="mr-1 h-3 w-3" />
                          Inactif
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-400">
                      <Mail className="h-4 w-4 mr-2" />
                      <span className="text-sm">Email:</span>
                    </div>
                    <p className="text-white ml-6">{userDetails.email}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-400">
                      <User className="h-4 w-4 mr-2" />
                      <span className="text-sm">Nom d'utilisateur:</span>
                    </div>
                    <p className="text-white ml-6">{userDetails.username}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-400">
                      <HardDrive className="h-4 w-4 mr-2" />
                      <span className="text-sm">Stockage:</span>
                    </div>
                    <div className="ml-6">
                      <p className="text-white">{formatBytes(userDetails.storageUsed)} / {formatBytes(userDetails.storageLimit)}</p>
                      <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500" 
                          style={{ width: `${getStoragePercentage(userDetails.storageUsed, userDetails.storageLimit)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-400">
                      <Info className="h-4 w-4 mr-2" />
                      <span className="text-sm">Dernière connexion:</span>
                    </div>
                    <p className="text-white ml-6">
                      {userDetails.lastLoginAt 
                        ? new Date(userDetails.lastLoginAt).toLocaleString() 
                        : 'Jamais connecté'}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-6 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedUserId(null);
                      openActionDialog(userDetails, 'change_role');
                    }}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Changer le rôle
                  </Button>
                  
                  {userDetails.isActive ? (
                    <Button 
                      variant="outline"
                      className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                      onClick={() => {
                        setSelectedUserId(null);
                        openActionDialog(userDetails, 'deactivate');
                      }}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Désactiver
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                      onClick={() => {
                        setSelectedUserId(null);
                        openActionDialog(userDetails, 'activate');
                      }}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Activer
                    </Button>
                  )}
                  
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      setSelectedUserId(null);
                      openActionDialog(userDetails, 'delete');
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-red-400">
                Erreur lors du chargement des détails
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
      
      {/* Dialogue d'action */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'activate' && 'Activer l\'utilisateur'}
              {actionType === 'deactivate' && 'Désactiver l\'utilisateur'}
              {actionType === 'delete' && 'Supprimer l\'utilisateur'}
              {actionType === 'reset_password' && 'Réinitialiser le mot de passe'}
              {actionType === 'change_role' && 'Changer le rôle'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'activate' && 'L\'utilisateur pourra accéder à son compte.'}
              {actionType === 'deactivate' && 'L\'utilisateur ne pourra plus se connecter.'}
              {actionType === 'delete' && 'Cette action est irréversible et supprimera toutes les données de l\'utilisateur.'}
              {actionType === 'reset_password' && 'Un email sera envoyé à l\'utilisateur.'}
              {actionType === 'change_role' && 'Modifiez le niveau d\'accès de l\'utilisateur.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                  {selectedUser.avatarUrl ? (
                    <img src={selectedUser.avatarUrl} alt={selectedUser.username} className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{selectedUser.fullName || selectedUser.username}</div>
                  <div className="text-xs text-gray-400">{selectedUser.email}</div>
                </div>
              </div>
              
              {actionType === 'change_role' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Sélectionner un rôle
                  </label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger className="w-full bg-gray-700/50 border-gray-600">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="user">Utilisateur</SelectItem>
                      <SelectItem value="moderator">Modérateur</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {actionType === 'delete' && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-800/30 rounded-md">
                  <p className="text-red-400 text-sm">
                    Attention: Cette action supprimera définitivement l'utilisateur et toutes ses données.
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsActionDialogOpen(false)}
            >
              Annuler
            </Button>
            
            <Button 
              onClick={performAction}
              disabled={userActionMutation.isPending}
              variant={actionType === 'delete' ? 'destructive' : 'default'}
            >
              {userActionMutation.isPending ? 'En cours...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}