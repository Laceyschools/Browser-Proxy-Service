import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Search, LayoutGrid, ArrowDownAZ } from "lucide-react";

const APPS = [
  { id: "yt", name: "YouTube", desc: "Video sharing platform", url: "https://youtube.com", color: "from-red-600 to-red-500" },
  { id: "google", name: "Google", desc: "Search engine", url: "https://google.com", color: "from-blue-500 to-green-400" },
  { id: "gmail", name: "Gmail", desc: "Email service", url: "https://mail.google.com", color: "from-red-500 to-rose-400" },
  { id: "reddit", name: "Reddit", desc: "(Currently DOES NOT WORK)", url: "https://reddit.com", color: "from-orange-500 to-amber-500" },
  { id: "twitter", name: "X / Twitter", desc: "(Currently DOES NOT WORK)", url: "https://x.com", color: "from-slate-800 to-slate-900" },
  { id: "github", name: "GitHub", desc: "Code hosting platform", url: "https://github.com", color: "from-neutral-800 to-stone-900" },
  { id: "discord", name: "Discord", desc: "(Currently DOES NOT WORK)", url: "https://discord.com", color: "from-indigo-500 to-violet-500" },
  { id: "wiki", name: "Wikipedia", desc: "Free encyclopedia", url: "https://wikipedia.org", color: "from-gray-300 to-gray-500" },
  { id: "amazon", name: "Amazon", desc: "Online shopping", url: "https://amazon.com", color: "from-yellow-500 to-orange-400" },
  { id: "netflix", name: "Netflix", desc: "Streaming service", url: "https://netflix.com", color: "from-red-700 to-red-600" },
  { id: "spotify", name: "Spotify", desc: "(Currently DOES NOT WORK)", url: "https://open.spotify.com", color: "from-green-500 to-emerald-500" },
  { id: "twitch", name: "Twitch", desc: "(Currently DOES NOT WORK)", url: "https://twitch.tv", color: "from-purple-600 to-violet-500" },
  { id: "tiktok", name: "TikTok", desc: "(Currently DOES NOT WORK)", url: "https://tiktok.com", color: "from-pink-500 to-cyan-400" },
  { id: "insta", name: "Instagram", desc: "Photo and video sharing", url: "https://instagram.com", color: "from-fuchsia-600 to-orange-500" },
  { id: "fb", name: "Facebook", desc: "Social networking", url: "https://facebook.com", color: "from-blue-600 to-blue-500" },
  { id: "linkedin", name: "LinkedIn", desc: "Professional networking", url: "https://linkedin.com", color: "from-sky-700 to-blue-600" },
  { id: "canva", name: "Canva", desc: "(Currently DOES NOT WORK)", url: "https://canva.com", color: "from-cyan-500 to-purple-500" },
  { id: "figma", name: "Figma", desc: "(Currently DOES NOT WORK)", url: "https://figma.com", color: "from-rose-400 to-violet-500" },
  { id: "notion", name: "Notion", desc: "Workspace and notes", url: "https://notion.so", color: "from-slate-600 to-slate-800" },
  { id: "docs", name: "Google Docs", desc: "Online word processor", url: "https://docs.google.com", color: "from-blue-400 to-blue-500" },
];

export default function Apps() {
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  let filteredApps = APPS.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase()));
  if (!sortAsc) filteredApps.reverse();

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-display font-bold text-white mb-2 flex items-center gap-3">
              <LayoutGrid className="w-10 h-10 text-primary" />
              Apps Library
            </h1>
            <p className="text-muted-foreground text-lg">Quick access to essential web apps securely.</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search apps..." 
                className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <button 
              onClick={() => setSortAsc(!sortAsc)}
              className="p-2.5 bg-secondary/50 border border-white/10 rounded-xl hover:bg-white/10 text-white transition-colors"
              title="Toggle Sort"
            >
              <ArrowDownAZ className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Grid */}
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredApps.map((app) => (
            <Link key={app.id} href={`/browse?url=${encodeURIComponent(app.url)}`}>
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                className="glass-card rounded-2xl overflow-hidden group cursor-pointer h-full flex flex-col hover:-translate-y-1 transition-transform duration-300"
              >
                {/* Thumbnail placeholder */}
                <div className={`h-36 w-full bg-gradient-to-br ${app.color} opacity-80 group-hover:opacity-100 transition-opacity flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <span className="text-5xl font-bold text-white/40 drop-shadow-md z-10 uppercase">{app.name.charAt(0)}</span>
                </div>
                
                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{app.name}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">{app.desc}</p>
                </div>
              </motion.div>
            </Link>
          ))}
          {filteredApps.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              <LayoutGrid className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-xl">No apps found matching "{search}"</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
