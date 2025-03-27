import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Share2, 
  FolderIcon,
  Clock,
  User,
  FileCheck,
  Activity,
  AlertTriangle,
  HardDrive,
  FileIcon
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import AdminLayout from './AdminLayout';

// Types pour les statistiques administratives
interface AdminStats {
  users: {
    total: number;
    active: number;
  };
  files: number;
  folders: number;
  shares: number;
  storage: {
    used: number;
  };
  recentActivity: Array<{
    id: number;
    userId: number;
    username?: string;
    action: string;
    targetType: string;
    targetId: number | null;
    details: string;
    createdAt: string;
  }>;
  userActivity: Array<{
    date: string;
    count: number;
  }>;
}

// Fonction pour formater les octets en taille lisible
export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Octets';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go', 'To'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Données pour le graphique de distribution des types de fichiers
const fileTypesData = [
  { name: 'Images', value: 45, color: '#3b82f6' },
  { name: 'Documents', value: 30, color: '#10b981' },
  { name: 'Vidéos', value: 15, color: '#ef4444' },
  { name: 'Audio', value: 10, color: '#8b5cf6' },
];

// Couleurs TAILWIND pour les graphiques
const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  light: '#f3f4f6',
  dark: '#1f2937',
};

export default function AdminDashboard() {
  // Requête pour récupérer les statistiques
  const { data: stats, isLoading, error } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    retry: 3,
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minute
  });
  
  // Données par défaut pour éviter les erreurs quand les données ne sont pas encore chargées
  const defaultStats: AdminStats = {
    users: { total: 0, active: 0 },
    files: 0,
    folders: 0,
    shares: 0,
    storage: { used: 0 },
    recentActivity: [],
    userActivity: []
  };

  // État pour les onglets
  const [activeTab, setActiveTab] = useState('overview');

  // Statut de chargement
  if (isLoading) {
    return (
      <AdminLayout title="Tableau de bord" subtitle="Vue d'ensemble du système">
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-blue-600/20 mb-3 flex items-center justify-center">
              <BarChart3 className="text-blue-500/50 animate-pulse" />
            </div>
            <div className="text-gray-400">Chargement des statistiques...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Gestion des erreurs
  if (error || !stats) {
    return (
      <AdminLayout title="Tableau de bord" subtitle="Vue d'ensemble du système">
        <div className="flex items-center justify-center py-10">
          <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-6 max-w-md">
            <div className="flex items-center text-red-500 mb-3">
              <AlertTriangle className="mr-2" size={20} />
              <h3 className="font-semibold">Erreur de chargement</h3>
            </div>
            <p className="text-gray-300">
              Impossible de charger les statistiques. Veuillez réessayer plus tard.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Détail: {error instanceof Error ? error.message : "Erreur inconnue"}
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Utiliser les statistiques ou les valeurs par défaut
  const safeStats = stats || defaultStats;
  
  // Préparer les données pour les graphiques
  const userActivityData = safeStats.userActivity.map(item => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    logins: item.count
  }));

  // Si nous n'avons pas de données d'activité, créer quelques données fictives pour montrer le format du graphique
  const demoActivityData = userActivityData.length > 0 ? userActivityData : [
    { date: '01 jan', logins: 0 },
    { date: '02 jan', logins: 0 },
    { date: '03 jan', logins: 0 },
  ];

  const storageUsedPercent = Math.min(100, (safeStats.storage.used / 1000000000000) * 100);

  // Données de distribution du stockage par utilisateur
  const storageDistributionData = [
    { name: 'Utilisé', value: safeStats.storage.used, color: '#3b82f6' },
    { name: 'Disponible', value: 1000000000000 - safeStats.storage.used, color: '#1f2937' }
  ];

  return (
    <AdminLayout title="Tableau de bord" subtitle="Vue d'ensemble du système">
      <Tabs defaultValue="overview" className="space-y-6" onValueChange={setActiveTab}>
        <div className="border-b border-gray-800/60 pb-2">
          <TabsList className="bg-gray-800/40">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500/10">
              <BarChart3 className="h-4 w-4 mr-2" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-500/10">
              <Users className="h-4 w-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-blue-500/10">
              <FileText className="h-4 w-4 mr-2" />
              Fichiers
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-blue-500/10">
              <Activity className="h-4 w-4 mr-2" />
              Activité
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {/* Cartes de statistiques */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gray-800/20 border-gray-700/50 backdrop-blur-sm shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{safeStats.users.total}</div>
                <p className="text-xs text-gray-400 mt-1">
                  {safeStats.users.active} actifs ({safeStats.users.total > 0 ? Math.round((safeStats.users.active / safeStats.users.total) * 100) : 0}%)
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/20 border-gray-700/50 backdrop-blur-sm shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fichiers</CardTitle>
                <FileText className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{safeStats.files}</div>
                <p className="text-xs text-gray-400 mt-1">
                  Dans {safeStats.folders} dossiers
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/20 border-gray-700/50 backdrop-blur-sm shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stockage</CardTitle>
                <HardDrive className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(safeStats.storage.used)}</div>
                <div className="mt-2">
                  <Progress value={storageUsedPercent} className="h-2 bg-gray-700" indicatorClassName="bg-gradient-to-r from-blue-600 to-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/20 border-gray-700/50 backdrop-blur-sm shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Partages</CardTitle>
                <Share2 className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{safeStats.shares}</div>
                <p className="text-xs text-gray-400 mt-1">
                  Liens de partage actifs
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gray-800/20 border-gray-700/50 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle>Activité Utilisateurs</CardTitle>
                <CardDescription>Connexions par jour (30 derniers jours)</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={userActivityData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <XAxis 
                        dataKey="date" 
                        stroke="#6b7280"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickLine={{ stroke: '#4b5563' }}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickLine={{ stroke: '#4b5563' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          borderColor: '#374151',
                          color: '#e5e7eb'
                        }}
                        itemStyle={{ color: '#e5e7eb' }}
                        labelStyle={{ color: '#e5e7eb' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="logins" 
                        name="Connexions"
                        stroke="#3b82f6" 
                        strokeWidth={2} 
                        dot={{ r: 3, fill: '#3b82f6', stroke: '#3b82f6' }} 
                        activeDot={{ r: 5, fill: '#60a5fa', stroke: '#2563eb' }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/20 border-gray-700/50 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle>Types de Fichiers</CardTitle>
                <CardDescription>Répartition par catégorie</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fileTypesData}
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        paddingAngle={4}
                        label
                      >
                        {fileTypesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#111827" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          borderColor: '#374151',
                          color: '#e5e7eb'
                        }}
                        itemStyle={{ color: '#e5e7eb' }}
                        labelStyle={{ color: '#e5e7eb' }}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ paddingTop: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activité récente */}
          <Card className="bg-gray-800/20 border-gray-700/50 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
              <CardDescription>Dernières actions administratives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {safeStats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4">
                    <div className="bg-blue-900/30 rounded-full p-2 mt-1">
                      {activity.action.includes('user') ? (
                        <User size={16} className="text-blue-400" />
                      ) : activity.action.includes('file') ? (
                        <FileCheck size={16} className="text-green-400" />
                      ) : (
                        <Clock size={16} className="text-purple-400" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-200">
                        {activity.username || `Utilisateur #${activity.userId}`}{' '}
                        <span className="text-gray-400 font-normal">
                          {activity.details}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(activity.createdAt), { 
                          addSuffix: true,
                          locale: fr
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet utilisateurs */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gray-800/20 border-gray-700/50 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle>Répartition des Utilisateurs</CardTitle>
                <CardDescription>Par statut et rôle</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Admin', total: Math.round(safeStats.users.total * 0.05) },
                        { name: 'Modérateur', total: Math.round(safeStats.users.total * 0.1) },
                        { name: 'Utilisateur', total: Math.round(safeStats.users.total * 0.85) },
                      ]}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <XAxis 
                        dataKey="name" 
                        stroke="#6b7280"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickLine={{ stroke: '#4b5563' }}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickLine={{ stroke: '#4b5563' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          borderColor: '#374151',
                          color: '#e5e7eb'
                        }}
                        itemStyle={{ color: '#e5e7eb' }}
                        labelStyle={{ color: '#e5e7eb' }}
                      />
                      <Bar 
                        dataKey="total" 
                        name="Nombre" 
                        radius={[4, 4, 0, 0]} 
                        barSize={30}
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#8b5cf6" />
                        <Cell fill="#10b981" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/20 border-gray-700/50 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle>Statut des Utilisateurs</CardTitle>
                <CardDescription>Actifs vs inactifs</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Actifs', value: safeStats.users.active, color: '#10b981' },
                          { name: 'Inactifs', value: safeStats.users.total - safeStats.users.active, color: '#6b7280' },
                        ]}
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        paddingAngle={4}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell key="cell-active" fill="#10b981" stroke="#111827" />
                        <Cell key="cell-inactive" fill="#6b7280" stroke="#111827" />
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          borderColor: '#374151',
                          color: '#e5e7eb'
                        }}
                        itemStyle={{ color: '#e5e7eb' }}
                        labelStyle={{ color: '#e5e7eb' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet fichiers */}
        <TabsContent value="files" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gray-800/20 border-gray-700/50 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle>Stockage Utilisé</CardTitle>
                <CardDescription>Répartition de l'espace</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={storageDistributionData}
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        paddingAngle={4}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {storageDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#111827" />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [formatBytes(value as number), 'Taille']}
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          borderColor: '#374151',
                          color: '#e5e7eb'
                        }}
                        itemStyle={{ color: '#e5e7eb' }}
                        labelStyle={{ color: '#e5e7eb' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-300">
                    {formatBytes(safeStats.storage.used)} utilisés sur 1 To
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/20 border-gray-700/50 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle>Types de Fichiers</CardTitle>
                <CardDescription>Répartition par format</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={fileTypesData}
                      layout="vertical"
                      margin={{ top: 20, right: 20, bottom: 20, left: 60 }}
                    >
                      <XAxis 
                        type="number"
                        stroke="#6b7280"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickLine={{ stroke: '#4b5563' }}
                      />
                      <YAxis 
                        type="category"
                        dataKey="name"
                        stroke="#6b7280"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickLine={{ stroke: '#4b5563' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          borderColor: '#374151',
                          color: '#e5e7eb'
                        }}
                        itemStyle={{ color: '#e5e7eb' }}
                        labelStyle={{ color: '#e5e7eb' }}
                      />
                      <Bar 
                        dataKey="value" 
                        name="Pourcentage" 
                        radius={[0, 4, 4, 0]} 
                        barSize={30}
                      >
                        {fileTypesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet activité */}
        <TabsContent value="activity" className="space-y-6">
          <Card className="bg-gray-800/20 border-gray-700/50 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
              <CardDescription>Détails des dernières actions administratives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="border-l-2 border-gray-700 absolute h-full left-7 top-0"></div>
                <ul className="space-y-8">
                  {safeStats.recentActivity.map((activity) => (
                    <li key={activity.id} className="ml-10 relative">
                      {/* Point sur la timeline */}
                      <div className="absolute -left-[40px] mt-1.5">
                        <div className="bg-gray-900 p-1 rounded-full border-2 border-blue-600">
                          {activity.action.includes('user') ? (
                            <User size={14} className="text-blue-400" />
                          ) : activity.action.includes('file') ? (
                            <FileIcon size={14} className="text-green-400" />
                          ) : activity.action.includes('role') ? (
                            <Users size={14} className="text-purple-400" />
                          ) : (
                            <Activity size={14} className="text-orange-400" />
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <h4 className="text-base font-medium text-gray-200">
                            {activity.username || `Utilisateur #${activity.userId}`}
                          </h4>
                          <p className="text-xs text-gray-400 bg-gray-700/30 px-2 py-1 rounded">
                            {formatDistanceToNow(new Date(activity.createdAt), { 
                              addSuffix: true,
                              locale: fr
                            })}
                          </p>
                        </div>
                        <p className="text-sm text-gray-300 mt-2">{activity.details}</p>
                        
                        <div className="flex gap-2 mt-3">
                          <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded">
                            {activity.action}
                          </span>
                          {activity.targetType && (
                            <span className="text-xs bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded">
                              {activity.targetType}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}