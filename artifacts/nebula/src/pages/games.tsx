import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, ArrowLeft, Maximize, RotateCw, Search, Loader2, AlertCircle, ExternalLink } from "lucide-react";

interface Game {
  id: string;
  title: string;
  url: string;
  thumbnail: string | null;
  description: string;
  category: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Arithmetic: "from-blue-600 to-blue-500",
  Algebra: "from-violet-600 to-purple-500",
  Geometry: "from-emerald-600 to-green-500",
  Fractions: "from-orange-600 to-amber-500",
  Multiplication: "from-rose-600 to-pink-500",
  Division: "from-cyan-600 to-sky-500",
  "Math Games": "from-indigo-600 to-blue-500",
};

const CATEGORY_ICONS: Record<string, string> = {
  Arithmetic: "➕",
  Algebra: "✖",
  Geometry: "📐",
  Fractions: "½",
  Multiplication: "×",
  Division: "÷",
  "Math Games": "🎮",
};

function GameCard({ game, onPlay }: { game: Game; onPlay: (game: Game) => void }) {
  const gradient = CATEGORY_COLORS[game.category] || "from-primary to-accent";
  const icon = CATEGORY_ICONS[game.category] || "🎮";

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="group cursor-pointer rounded-2xl overflow-hidden border border-white/8 bg-secondary/60 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
      onClick={() => onPlay(game)}
    >
      <div className={`relative h-32 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
        {game.thumbnail ? (
          <img
            src={game.thumbnail}
            alt={game.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <span className="text-5xl select-none drop-shadow-lg">{icon}</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-2 right-2">
          <span className="text-xs bg-black/40 backdrop-blur-sm text-white/80 px-2 py-0.5 rounded-full border border-white/10">
            {game.category}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white text-sm leading-tight truncate group-hover:text-primary transition-colors">
          {game.title}
        </h3>
        {game.description && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{game.description}</p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xs text-white`}>
            ▶
          </div>
          <span className="text-xs font-medium text-primary">Play Now</span>
        </div>
      </div>
    </motion.div>
  );
}

function GameViewer({ game, onBack }: { game: Game; onBack: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const gameUrl = useProxy
    ? `/api/proxy?url=${encodeURIComponent(game.url)}`
    : game.url;

  const handleLoad = () => { setIsLoading(false); setLoadError(false); };
  const handleError = () => {
    if (!useProxy) {
      setUseProxy(true);
      setIsLoading(true);
    } else {
      setIsLoading(false);
      setLoadError(true);
    }
  };

  const handleReload = () => {
    if (!iframeRef.current) return;
    setIsLoading(true);
    setLoadError(false);
    const current = iframeRef.current.src;
    iframeRef.current.src = "about:blank";
    setTimeout(() => { if (iframeRef.current) iframeRef.current.src = current; }, 50);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full w-full">
      <div className="h-14 flex-shrink-0 border-b border-white/5 bg-secondary/80 backdrop-blur-md flex items-center px-4 gap-3 z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="flex-1 flex items-center gap-2 overflow-hidden">
          <Gamepad2 className="w-4 h-4 text-primary shrink-0" />
          <span className="font-semibold text-white text-sm truncate">{game.title}</span>
          <span className="text-xs text-muted-foreground/60 bg-white/5 px-2 py-0.5 rounded-full shrink-0">{game.category}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleReload} title="Reload" className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-white/10 hover:text-white transition-colors">
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setUseProxy(!useProxy); setIsLoading(true); setLoadError(false); }}
            title={useProxy ? "Switch to direct" : "Switch to proxy"}
            className={`text-xs px-2 py-1 rounded-lg transition-colors ${useProxy ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:bg-white/10 hover:text-white"}`}
          >
            {useProxy ? "Proxied" : "Direct"}
          </button>
          <button
            onClick={() => iframeRef.current?.requestFullscreen?.().catch(() => {})}
            title="Fullscreen"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
          >
            <Maximize className="w-4 h-4" />
          </button>
          <a href={game.url} target="_blank" rel="noopener noreferrer" title="Open in new tab" className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-white/10 hover:text-white transition-colors">
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading {game.title}...</p>
            </div>
          </div>
        )}
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="flex flex-col items-center gap-4 max-w-sm text-center p-8">
              <AlertCircle className="w-12 h-12 text-destructive/60" />
              <div>
                <h3 className="font-semibold text-white mb-2">Could not load game</h3>
                <p className="text-sm text-muted-foreground mb-4">This game may block embedding. Try opening it directly.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleReload} className="px-4 py-2 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition-colors">
                  Try Again
                </button>
                <a href={game.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Directly
                </a>
              </div>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={gameUrl}
          className="w-full h-full border-none"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation allow-pointer-lock"
          allow="fullscreen; pointer-lock"
          onLoad={handleLoad}
          onError={handleError}
          style={{ display: "block" }}
          title={game.title}
        />
      </div>
    </motion.div>
  );
}

export default function Games() {
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const res = await fetch("/api/games");
      if (!res.ok) throw new Error("Failed to fetch games");
      return res.json() as Promise<{ games: Game[] }>;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const games = data?.games ?? [];
  const categories = ["All", ...Array.from(new Set(games.map((g) => g.category)))];

  const filtered = games.filter((g) => {
    const matchSearch =
      !search ||
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase()) ||
      g.category.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "All" || g.category === activeCategory;
    return matchSearch && matchCategory;
  });

  if (activeGame) {
    return (
      <AnimatePresence mode="wait">
        <GameViewer key={activeGame.id} game={activeGame} onBack={() => setActiveGame(null)} />
      </AnimatePresence>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex-shrink-0 border-b border-white/5 bg-secondary/30 backdrop-blur-sm px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-primary" />
              Games
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Games from{" "}
              <a href="https://gn-math.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                GN Math
              </a>
            </p>
          </div>
          <button onClick={() => refetch()} className="p-2 rounded-lg text-muted-foreground hover:bg-white/10 hover:text-white transition-colors" title="Refresh">
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {categories.length > 2 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-primary text-white shadow-sm shadow-primary/30"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                {CATEGORY_ICONS[cat] && <span className="mr-1">{CATEGORY_ICONS[cat]}</span>}
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading games from GN Math...</p>
          </div>
        )}
        {isError && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="w-10 h-10 text-destructive/60" />
            <div className="text-center">
              <p className="font-medium text-white mb-1">Could not load games</p>
              <p className="text-sm text-muted-foreground mb-4">The backend may still be starting up</p>
              <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary/90 transition-colors">
                Try Again
              </button>
            </div>
          </div>
        )}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Gamepad2 className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No games found</p>
            {search && <button onClick={() => setSearch("")} className="text-xs text-primary hover:underline">Clear search</button>}
          </div>
        )}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <GameCard game={game} onPlay={setActiveGame} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
