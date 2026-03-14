import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Clock, 
  Globe, 
  Gamepad2, 
  LayoutGrid, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Monitor
} from "lucide-react";
import { useSettings } from "@/store/use-settings";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: Clock },
  { path: "/browse", label: "Proxy", icon: Globe },
  { path: "/games", label: "Games", icon: Gamepad2 },
  { path: "/apps", label: "Apps", icon: LayoutGrid },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const settings = useSettings();

  // Tab Cloaking Logic
  useEffect(() => {
    let originalTitle = document.title;
    let originalIcon = (document.querySelector("link[rel*='icon']") as HTMLLinkElement)?.href;

    const applyCloak = () => {
      document.title = settings.cloakTitle || "Nebula";
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = settings.cloakIcon || '/favicon.svg';
      document.getElementsByTagName('head')[0].appendChild(link);
    };

    const removeCloak = () => {
      document.title = originalTitle;
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) link.href = originalIcon || '/favicon.svg';
    };

    if (settings.tabCloakEnabled) {
      applyCloak();
    } else {
      removeCloak();
    }

    const handleVisibilityChange = () => {
      if (settings.tabSwitchCloak && !settings.tabCloakEnabled) {
        if (document.hidden) applyCloak();
        else removeCloak();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (!settings.tabCloakEnabled) removeCloak(); // Cleanup
    };
  }, [settings.tabCloakEnabled, settings.cloakTitle, settings.cloakIcon, settings.tabSwitchCloak]);

  // Anti-close Logic
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (settings.antiClose) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [settings.antiClose]);

  // Panic Key Logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === settings.panicKey && e.target?.tagName !== 'INPUT' && e.target?.tagName !== 'TEXTAREA') {
        window.location.replace(settings.panicUrl);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.panicKey, settings.panicUrl]);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 240 : 80 }}
        className="h-full flex-shrink-0 border-r border-white/5 bg-secondary/50 backdrop-blur-xl flex flex-col relative z-20"
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <Monitor className="w-4 h-4 text-white" />
            </div>
            {isSidebarOpen && (
              <span className="font-display font-bold text-xl text-white tracking-wide">Nebula</span>
            )}
          </div>
        </div>

        <nav className="flex-1 py-8 px-4 flex flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
                title={!isSidebarOpen ? item.label : undefined}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn("w-5 h-5 shrink-0 relative z-10 transition-colors", isActive ? "text-primary" : "")} />
                {isSidebarOpen && (
                  <span className="font-medium relative z-10">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-4 top-24 w-8 h-8 rounded-full bg-secondary border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-colors z-30"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {isSidebarOpen && (
          <div className="p-6 border-t border-white/5">
            <p className="text-xs text-muted-foreground/60 font-medium">Nebula v1.0.0</p>
          </div>
        )}
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 h-full relative overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
