import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Image,
  Film,
  Music,
  File,
  Archive,
  BarChart2,
  Trash2,
  Search,
  Filter,
  RefreshCcw,
  HardDrive
} from 'lucide-react';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatBytes } from './AdminDashboard';
import AdminLayout from './AdminLayout';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

// Types
interface FileStats {
  byType: {
    type: string;
    count: number;
    totalSize: number;
  }[];
  byStatus: {
    status: string;
    count: number;
  }[];
  totalFiles: number;
  totalSize: number;
  largestFiles: FileItem[];
  recentlyUploaded: FileItem[];
  recentlyDeleted: FileItem[];
  mostDownloaded: FileItem[];
}

interface FileItem {
  id: number;
  name: string;
  userId: number;
  username?: string;
  type: string;
  size: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  downloads?: number;
}

interface FileListResponse {
  files: FileItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function FilesPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [fileType, setFileType] = useState('all');
  const [fileStatus, setFileStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Récupérer les statistiques des fichiers
  const { data: fileStats, isLoading: statsLoading } = useQuery<FileStats>({
    queryKey: ['/api/admin/files'],
    refetchOnWindowFocus: false,
  });

  // Récupérer la liste des fichiers avec filtres
  const { data: fileList, isLoading: filesLoading } = useQuery<FileListResponse>({
    queryKey: ['/api/admin/files/list', searchQuery, fileType, fileStatus, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (fileType && fileType !== 'all') params.append('type', fileType);
      if (fileStatus && fileStatus !== 'all') params.append('status', fileStatus);
      params.append('page', currentPage.toString());
      
      const res = await fetch(`/api/admin/files/list?${params.toString()}`);
      if (!res.ok) throw new Error('Erreur lors de la récupération des fichiers');
      return res.json();
    },
    enabled: activeTab === 'files',
  });

  // Function to handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  // Helper function to get icon based on file type
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-5 w-5 text-blue-400" />;
      case 'video':
        return <Film className="h-5 w-5 text-red-400" />;
      case 'audio':
        return <Music className="h-5 w-5 text-purple-400" />;
      case 'document':
        return <FileText className="h-5 w-5 text-green-400" />;
      case 'archive':
        return <Archive className="h-5 w-5 text-yellow-400" />;
      default:
        return <File className="h-5 w-5 text-gray-400" />;
    }
  };

  // Helper function to get color based on file status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-500 border-green-700/30';
      case 'trashed':
        return 'bg-orange-500/20 text-orange-500 border-orange-700/30';
      case 'deleted':
        return 'bg-red-500/20 text-red-500 border-red-700/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-600/30';
    }
  };

  // Loading state
  if ((statsLoading && activeTab === 'overview') || (filesLoading && activeTab === 'files')) {
    return (
      <AdminLayout title="Fichiers" subtitle="Gestion des fichiers du système">
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-blue-600/20 mb-3 flex items-center justify-center">
              <FileText className="text-blue-500/50 animate-pulse" />
            </div>
            <div className="text-gray-400">Chargement des données...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Default data for charts if API returns no data yet
  const fileTypeData = fileStats?.byType.map(item => ({
    name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
    value: item.count,
    size: item.totalSize,
    color: 
      item.type === 'image' 
        ? '#3b82f6' 
        : item.type === 'document' 
        ? '#10b981' 
        : item.type === 'video' 
        ? '#ef4444' 
        : item.type === 'audio' 
        ? '#8b5cf6' 
        : item.type === 'archive' 
        ? '#f59e0b' 
        : '#6b7280'
  })) || [];

  const fileStatusData = fileStats?.byStatus.map(item => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
    color: 
      item.status === 'active' 
        ? '#10b981' 
        : item.status === 'trashed' 
        ? '#f59e0b' 
        : '#ef4444'
  })) || [];

  return (
    <AdminLayout title="Fichiers" subtitle="Gestion des fichiers du système">
      <Tabs value={activeTab} className="space-y-6" onValueChange={setActiveTab}>
        <div className="border-b border-gray-800/60 pb-2">
          <TabsList className="bg-gray-800/40">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500/10">
              <BarChart2 className="h-4 w-4 mr-2" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-blue-500/10">
              <FileText className="h-4 w-4 mr-2" />
              Liste des fichiers
            </TabsTrigger>
            <TabsTrigger value="trash" className="data-[state=active]:bg-blue-500/10">
              <Trash2 className="h-4 w-4 mr-2" />
              Corbeille
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {/* Cartes des statistiques */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gray-800/20 border-gray-700/50 backdrop-blur-sm shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Fichiers</CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fileStats?.totalFiles || 0}</div>
                <p className="text-xs text-gray-400 mt-1">
                  {formatBytes(fileStats?.totalSize || 0)} utilisés
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/20 border-gray-700/50 backdrop-blur-sm shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Images</CardTitle>
                <Image className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {fileStats?.byType.find(t => t.type === 'image')?.count || 0}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {formatBytes(fileStats?.byType.find(t => t.type === 'image')?.totalSize || 0)}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/20 border-gray-700/50 backdrop-blur-sm shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents</CardTitle>
                <FileText className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {fileStats?.byType.find(t => t.type === 'document')?.count || 0}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {formatBytes(fileStats?.byType.find(t => t.type === 'document')?.totalSize || 0)}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/20 border-gray-700/50 backdrop-blur-sm shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Multimédia</CardTitle>
                <Film className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(fileStats?.byType.find(t => t.type === 'video')?.count || 0) + 
                   (fileStats?.byType.find(t => t.type === 'audio')?.count || 0)}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {formatBytes(
                    (fileStats?.byType.find(t => t.type === 'video')?.totalSize || 0) + 
                    (fileStats?.byType.find(t => t.type === 'audio')?.totalSize || 0)
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gray-800/20 border-gray-700/50 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle>Types de Fichiers</CardTitle>
                <CardDescription>Distribution par type</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fileTypeData}
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        paddingAngle={4}
                        label
                      >
                        {fileTypeData.map((entry, index) => (
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
                        formatter={(value: any, name, props) => [
                          `${value} fichier${Number(value) > 1 ? 's' : ''} (${formatBytes(props.payload.size)})`,
                          name
                        ]}
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

            <Card className="bg-gray-800/20 border-gray-700/50 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle>Statut des Fichiers</CardTitle>
                <CardDescription>Actifs, corbeille, supprimés</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={fileStatusData}
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
                        dataKey="value" 
                        name="Nombre de fichiers" 
                        radius={[4, 4, 0, 0]}
                      >
                        {fileStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Listes des fichiers remarquables */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gray-800/20 border-gray-700/50 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle>Fichiers les plus volumineux</CardTitle>
                <CardDescription>Top 5 des fichiers par taille</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fileStats?.largestFiles?.slice(0, 5).map((file, index) => (
                    <div key={file.id} className="flex items-center space-x-4">
                      <div className="bg-gray-900/40 rounded-full p-2">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-gray-200 truncate">{file.name}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {file.username || `Utilisateur #${file.userId}`}
                          </span>
                          <span className="text-xs font-medium text-blue-400">
                            {formatBytes(file.size)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!fileStats?.largestFiles || fileStats.largestFiles.length === 0) && (
                    <div className="text-center py-6 text-gray-400">
                      Aucun fichier disponible
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/20 border-gray-700/50 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle>Fichiers récemment ajoutés</CardTitle>
                <CardDescription>5 derniers fichiers téléchargés</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fileStats?.recentlyUploaded?.slice(0, 5).map((file, index) => (
                    <div key={file.id} className="flex items-center space-x-4">
                      <div className="bg-gray-900/40 rounded-full p-2">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-gray-200 truncate">{file.name}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {file.username || `Utilisateur #${file.userId}`}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(file.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!fileStats?.recentlyUploaded || fileStats.recentlyUploaded.length === 0) && (
                    <div className="text-center py-6 text-gray-400">
                      Aucun fichier récent disponible
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Liste des fichiers */}
        <TabsContent value="files" className="space-y-6">
          {/* Filtres et recherche */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <form onSubmit={handleSearch} className="flex w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Rechercher un fichier..."
                  className="pl-9 bg-gray-800/40 border-gray-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" className="ml-2">
                Rechercher
              </Button>
            </form>

            <div className="flex flex-wrap gap-2">
              <Select value={fileType} onValueChange={setFileType}>
                <SelectTrigger className="w-[150px] bg-gray-800/40 border-gray-700">
                  <SelectValue placeholder="Type de fichier" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="video">Vidéos</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="archive">Archives</SelectItem>
                  <SelectItem value="other">Autres</SelectItem>
                </SelectContent>
              </Select>

              <Select value={fileStatus} onValueChange={setFileStatus}>
                <SelectTrigger className="w-[150px] bg-gray-800/40 border-gray-700">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="trashed">Corbeille</SelectItem>
                  <SelectItem value="deleted">Supprimés</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                className="border-gray-700 hover:bg-gray-700/50"
                onClick={() => {
                  setSearchQuery('');
                  setFileType('all');
                  setFileStatus('all');
                  setCurrentPage(1);
                }}
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>

          {/* Tableau des fichiers */}
          <Card className="bg-gray-800/20 border-gray-700/50 shadow-xl">
            <CardHeader>
              <CardTitle>Liste des fichiers</CardTitle>
              <CardDescription>
                {fileList?.total || 0} fichiers correspondent aux critères
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-gray-700/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-800/50">
                    <TableRow>
                      <TableHead className="text-gray-300 font-medium">Nom</TableHead>
                      <TableHead className="text-gray-300 font-medium">Utilisateur</TableHead>
                      <TableHead className="text-gray-300 font-medium">Type</TableHead>
                      <TableHead className="text-gray-300 font-medium">Taille</TableHead>
                      <TableHead className="text-gray-300 font-medium">Statut</TableHead>
                      <TableHead className="text-gray-300 font-medium">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fileList?.files.map((file) => (
                      <TableRow key={file.id} className="border-gray-700/30 hover:bg-gray-800/30">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="bg-gray-900/40 rounded-full p-1.5">
                              {getFileIcon(file.type)}
                            </div>
                            <span className="text-gray-300 truncate max-w-[150px]">{file.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {file.username || `User #${file.userId}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-700/30">
                            {file.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {formatBytes(file.size)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(file.status)}>
                            {file.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {new Date(file.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}

                    {(!fileList?.files || fileList.files.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                          Aucun fichier trouvé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>

            {fileList && fileList.totalPages > 1 && (
              <CardFooter className="flex items-center justify-between border-t border-gray-700/30 pt-4">
                <div className="text-sm text-gray-400">
                  Page {fileList.page} sur {fileList.totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={fileList.page === 1}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(fileList.totalPages, prev + 1))}
                    disabled={fileList.page === fileList.totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        {/* Vue Corbeille */}
        <TabsContent value="trash" className="space-y-6">
          <Card className="bg-gray-800/20 border-gray-700/50 shadow-xl">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Corbeille</CardTitle>
                  <CardDescription>
                    Fichiers supprimés récemment
                  </CardDescription>
                </div>
                <div className="flex mt-4 md:mt-0 space-x-2">
                  <Button variant="destructive" className="shadow-glow-red">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Vider la corbeille
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-gray-700/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-800/50">
                    <TableRow>
                      <TableHead className="text-gray-300 font-medium">Nom</TableHead>
                      <TableHead className="text-gray-300 font-medium">Utilisateur</TableHead>
                      <TableHead className="text-gray-300 font-medium">Type</TableHead>
                      <TableHead className="text-gray-300 font-medium">Taille</TableHead>
                      <TableHead className="text-gray-300 font-medium">Supprimé le</TableHead>
                      <TableHead className="text-gray-300 font-medium w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fileStats?.recentlyDeleted?.map((file) => (
                      <TableRow key={file.id} className="border-gray-700/30 hover:bg-gray-800/30">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="bg-gray-900/40 rounded-full p-1.5">
                              {getFileIcon(file.type)}
                            </div>
                            <span className="text-gray-300 truncate max-w-[150px]">{file.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {file.username || `User #${file.userId}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-700/30">
                            {file.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {formatBytes(file.size)}
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {new Date(file.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="h-8 px-2 border-gray-700 hover:bg-gray-700/30">
                              <RefreshCcw size={14} className="text-green-400" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 px-2 border-gray-700 hover:bg-gray-700/30">
                              <Trash2 size={14} className="text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {(!fileStats?.recentlyDeleted || fileStats.recentlyDeleted.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                          La corbeille est vide
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
    </AdminLayout>
  );
}