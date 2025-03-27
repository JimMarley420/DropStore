import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Users,
  Files,
  Settings,
  AlertCircle,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Home,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

// Layout pour les pages d'administration
export default function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [menuOpen, setMenuOpen] = useState(true);

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

  const navItems = [
    {
      icon: BarChart3,
      label: "Tableau de bord",
      href: "/admin",
      active: location === "/admin",
    },
    {
      icon: Users,
      label: "Utilisateurs",
      href: "/admin/users",
      active: location.startsWith("/admin/users"),
    },
    {
      icon: Files,
      label: "Fichiers",
      href: "/admin/files",
      active: location.startsWith("/admin/files"),
    },
    {
      icon: AlertCircle,
      label: "Journaux d'activité",
      href: "/admin/logs",
      active: location.startsWith("/admin/logs"),
    },
    {
      icon: Settings,
      label: "Paramètres",
      href: "/admin/settings",
      active: location.startsWith("/admin/settings"),
    },
  ];

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 transition-all duration-300",
          menuOpen ? "translate-x-0" : "-translate-x-60"
        )}
      >
        <div className="flex flex-col h-full p-5">
          {/* Sidebar Header */}
          <div className="flex items-center mb-6">
            <div className="text-blue-400 text-3xl mr-2">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
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
                  <linearGradient
                    id="logo-gradient"
                    x1="4"
                    y1="2"
                    x2="20"
                    y2="22"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold gradient-heading text-glow">
                DropStore
              </h1>
              <span className="text-gray-400 text-xs">Panel d'administration</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 py-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-4 py-3 rounded-md text-sm font-medium transition-colors",
                    item.active
                      ? "bg-gray-800/80 text-blue-400"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  )}
                >
                  <item.icon
                    className={cn("h-5 w-5 mr-3", item.active ? "text-blue-400" : "text-gray-500")}
                  />
                  <span className={menuOpen ? "opacity-100" : "opacity-0"}>
                    {item.label}
                  </span>
                  {item.active && <ChevronRight className="ml-auto h-5 w-5 text-blue-400" />}
                </a>
              </Link>
            ))}
          </nav>

          <Separator className="my-4 bg-gray-800" />

          {/* Retour à l'application */}
          <Link href="/">
            <a className="flex items-center px-4 py-3 rounded-md text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 mb-4 transition-colors">
              <Home className="h-5 w-5 mr-3 text-gray-500" />
              <span className={menuOpen ? "opacity-100" : "opacity-0"}>
                Retour à l'application
              </span>
            </a>
          </Link>

          {/* User Info */}
          <div className="flex items-center p-4 rounded-md bg-gray-800/60">
            <Avatar className="h-10 w-10 mr-3 gradient-border">
              <AvatarImage src={user?.avatarUrl || ""} alt={user?.username || "Admin"} />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className={cn("flex-1 overflow-hidden", menuOpen ? "block" : "hidden")}>
              <p className="text-sm font-medium truncate text-gray-200">{user?.username}</p>
              <p className="text-xs truncate text-gray-400">{user?.role}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Toggle Sidebar Button */}
      <button
        className="fixed left-64 top-4 z-50 p-2 bg-gray-800/80 rounded-full border border-gray-700/50 shadow-lg transition-all hover:bg-gray-700/80"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? "Réduire le menu" : "Ouvrir le menu"}
        style={{ transform: menuOpen ? "translateX(10px)" : "translateX(-50px)" }}
      >
        {menuOpen ? (
          <ChevronLeft className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 overflow-auto transition-all duration-300 p-6",
          menuOpen ? "ml-64" : "ml-10"
        )}
      >
        <div className="container mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}