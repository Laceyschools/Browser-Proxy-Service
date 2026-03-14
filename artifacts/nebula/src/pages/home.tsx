import { useEffect, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Globe, Search, ArrowRight } from "lucide-react";
import { useSettings } from "@/store/use-settings";

const SHORTCUTS = [
  { name: "Google", url: "https://google.com", icon: "https://www.google.com/favicon.ico" },
  { name: "YouTube", url: "https://youtube.com", icon: "https://www.youtube.com/favicon.ico" },
  { name: "X / Twitter", url: "https://x.com", icon: "https://abs.twimg.com/favicons/twitter.3.ico" },
  { name: "Discord", url: "https://discord.com", icon: "https://discord.com/assets/favicon.ico" },
  { name: "GitHub", url: "https://github.com", icon: "https://github.com/favicon.ico" },
  { name: "Wikipedia", url: "https://wikipedia.org", icon: "https://en.wikipedia.org/favicon.ico" },
];

export default function Home() {
  const [time, setTime] = useState(new Date());
  const [search, setSearch] = useState("");
  const settings = useSettings();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    
    // Convert to target URL logic similar to browse page
    let target = search.trim();
    if (!/^https?:\/\//i.test(target) && !/^[a-z0-9-]+\.[a-z]{2,}/i.test(target)) {
      if (settings.searchEngine === 'google') target = `https://www.google.com/search?q=${encodeURIComponent(target)}`;
      else if (settings.searchEngine === 'duckduckgo') target = `https://duckduckgo.com/?q=${encodeURIComponent(target)}`;
      else if (settings.searchEngine === 'bing') target = `https://www.bing.com/search?q=${encodeURIComponent(target)}`;
      else if (settings.searchEngine === 'brave') target = `https://search.brave.com/search?q=${encodeURIComponent(target)}`;
    } else if (!/^https?:\/\//i.test(target)) {
      target = `https://${target}`;
    }
    
    window.location.href = `${import.meta.env.BASE_URL}browse?url=${encodeURIComponent(target)}`;
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none"
        style={{
          backgroundImage: `url('${import.meta.env.BASE_URL}images/nebula-bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background z-0 pointer-events-none" />

      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center">
        {/* Clock */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            {format(time, "hh:mm")}
          </h1>
          <p className="text-xl md:text-2xl text-primary font-medium mt-2 tracking-wide uppercase drop-shadow-[0_0_10px_rgba(124,58,237,0.5)]">
            {format(time, "EEEE, MMMM do")}
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          onSubmit={handleSearch}
          className="w-full max-w-2xl relative mb-16 group"
        >
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative glass-panel rounded-full flex items-center px-6 py-4 transition-all duration-300 group-hover:border-primary/50 group-focus-within:border-primary group-focus-within:ring-4 group-focus-within:ring-primary/20">
            <Search className="w-6 h-6 text-muted-foreground mr-4" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search the web or enter a URL..."
              className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder:text-muted-foreground/70"
            />
            <button type="submit" className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform shadow-lg shadow-primary/25 ml-2">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.form>

        {/* Shortcuts */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="w-full grid grid-cols-3 sm:grid-cols-6 gap-4 md:gap-6"
        >
          {SHORTCUTS.map((shortcut, i) => (
            <Link 
              key={i} 
              href={`/browse?url=${encodeURIComponent(shortcut.url)}`}
              className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center gap-3 group hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <img src={shortcut.icon} alt={shortcut.name} className="w-6 h-6" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-white transition-colors">
                {shortcut.name}
              </span>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
