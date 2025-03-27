import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Loader2, Users, Files, Share2, HardDrive, Activity } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import AdminLayout from "./AdminLayout";
import { formatBytes } from "@/lib/utils";

type AdminStatsResponse = {
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
    username: string;
    action: string;
    targetType: string;
    targetId: number | null;
    details: string | null;
    createdAt: string;
  }>;
  userActivity: Array<{
    date: string;
    count: number;
  }>;
};

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery<AdminStatsResponse, Error>({
    queryKey: ["/api/admin/stats"],
    queryFn: getQueryFn(),
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="rounded-lg bg-red-900/30 border border-red-700/30 p-4 mb-4">
          <h3 className="text-red-400 font-semibold">Erreur de chargement</h3>
          <p className="text-gray-300 text-sm">{error.message}</p>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="rounded-lg bg-gray-800/80 border border-gray-700/30 p-4 mb-4">
          <h3 className="text-gray-400 font-semibold">Aucune donnée disponible</h3>
        </div>
      </AdminLayout>
    );
  }

  const userPercentage = Math.round((data.users.active / data.users.total) * 100) || 0;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold gradient-heading">Tableau de bord administratif</h1>
        <p className="text-gray-400 mt-1">Vue d'ensemble du système et des activités</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-gray-800/80 border-gray-700/30 hover-float">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.users.total}</div>
            <div className="text-xs text-muted-foreground text-gray-400 mt-1">
              {data.users.active} actifs ({userPercentage}%)
            </div>
            <Progress
              value={userPercentage}
              className="h-1 mt-3 bg-gray-700"
              indicatorClassName="gradient-progress"
            />
          </CardContent>
        </Card>

        <Card className="bg-gray-800/80 border-gray-700/30 hover-float">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Fichiers</CardTitle>
            <Files className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.files}</div>
            <div className="text-xs text-muted-foreground text-gray-400 mt-1">
              {data.folders} dossiers
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/80 border-gray-700/30 hover-float">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Partages</CardTitle>
            <Share2 className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.shares}</div>
            <div className="text-xs text-muted-foreground text-gray-400 mt-1">
              Liens de partage actifs
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/80 border-gray-700/30 hover-float">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Stockage</CardTitle>
            <HardDrive className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatBytes(data.storage.used)}</div>
            <div className="text-xs text-muted-foreground text-gray-400 mt-1">
              Espace total utilisé
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gray-800/80 border-gray-700/30 lg:col-span-2 hover-float">
          <CardHeader>
            <CardTitle className="text-gray-200">Activité récente</CardTitle>
            <CardDescription className="text-gray-400">Dernières actions administratives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivity.length > 0 ? (
                data.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className="rounded-full p-2 bg-gray-900/50 border border-gray-700/30">
                      <Activity className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none text-gray-200">
                        {activity.username}
                      </p>
                      <p className="text-sm text-gray-400">
                        {activity.action} - {activity.targetType}
                        {activity.targetId ? ` (ID: ${activity.targetId})` : ""}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">Aucune activité récente</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/80 border-gray-700/30 hover-float">
          <CardHeader>
            <CardTitle className="text-gray-200">Statistiques d'utilisation</CardTitle>
            <CardDescription className="text-gray-400">
              Connexions journalières des 30 derniers jours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex flex-col justify-center">
              {data.userActivity && data.userActivity.length > 0 ? (
                <div className="flex flex-col space-y-2">
                  {data.userActivity.slice(-7).map((day) => (
                    <div key={day.date} className="flex items-center gap-2">
                      <div className="w-16 text-xs text-gray-400">
                        {new Date(day.date).toLocaleDateString(undefined, { 
                          day: '2-digit', 
                          month: '2-digit' 
                        })}
                      </div>
                      <div className="w-full bg-gray-700/30 rounded-full h-2">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                          style={{
                            width: `${Math.min(100, (day.count / 10) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="w-8 text-xs text-right text-gray-400">{day.count}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center">Aucune donnée disponible</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}