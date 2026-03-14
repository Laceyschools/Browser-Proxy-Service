import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Search, Gamepad2, Shuffle, ArrowDownAZ } from "lucide-react";

const GAMES = [
  { id: "1v1", name: "1v1.lol", desc: "Build & Shoot multiplayer", url: "https://1v1.lol", color: "from-blue-500 to-cyan-400" },
  { id: "2048", name: "2048", desc: "Classic number puzzle", url: "https://play2048.co", color: "from-yellow-500 to-orange-400" },
  { id: "8ball", name: "8 Ball Pool", desc: "Online multiplayer pool", url: "https://miniclip.com/games/8-ball-pool-multiplayer", color: "from-green-600 to-emerald-400" },
  { id: "agar", name: "Agar.io", desc: "Eat cells, grow big", url: "https://agar.io", color: "from-red-500 to-rose-400" },
  { id: "among", name: "Among Us", desc: "Find the impostor", url: "https://now.gg/play/innersloth-llc/4047/among-us", color: "from-red-600 to-red-400" },
  { id: "slope", name: "Slope", desc: "Endless rolling ball", url: "https://slopegame.io", color: "from-emerald-500 to-teal-400" },
  { id: "snake", name: "Snake", desc: "Classic snake game", url: "https://playsnake.org", color: "from-green-500 to-lime-400" },
  { id: "tetris", name: "Tetris", desc: "Falling blocks puzzle", url: "https://tetris.com/play-tetris", color: "from-purple-500 to-indigo-400" },
  { id: "minecraft", name: "Minecraft Classic", desc: "Build in browser", url: "https://classic.minecraft.net", color: "from-amber-700 to-yellow-600" },
  { id: "krunker", name: "Krunker.io", desc: "Fast-paced FPS", url: "https://krunker.io", color: "from-stone-700 to-stone-500" },
  { id: "shell", name: "Shell Shockers", desc: "Egg-based shooter", url: "https://shellshock.io", color: "from-orange-400 to-amber-300" },
  { id: "bloxd", name: "Bloxd.io", desc: "Voxel multiplayer", url: "https://bloxd.io", color: "from-sky-500 to-cyan-400" },
  { id: "skribbl", name: "Skribbl.io", desc: "Draw and guess", url: "https://skribbl.io", color: "from-pink-500 to-rose-400" },
  { id: "wordle", name: "Wordle", desc: "Daily word puzzle", url: "https://www.nytimes.com/games/wordle/index.html", color: "from-emerald-600 to-green-500" },
  { id: "chess", name: "Chess.com", desc: "Play chess online", url: "https://chess.com", color: "from-zinc-700 to-stone-500" },
  { id: "sudoku", name: "Sudoku", desc: "Logic number placement", url: "https://sudoku.com", color: "from-blue-600 to-indigo-500" },
  { id: "minesweeper", name: "Minesweeper", desc: "Avoid the bombs", url: "https://minesweeperonline.com", color: "from-red-700 to-rose-600" },
  { id: "pacman", name: "Pac-Man", desc: "Retro arcade action", url: "https://freepacman.org", color: "from-yellow-400 to-amber-400" },
  { id: "space", name: "Space Invaders", desc: "Defend against aliens", url: "https://freeinvaders.org", color: "from-indigo-600 to-violet-500" },
  { id: "flappy", name: "Flappy Bird", desc: "Tap to fly", url: "https://flappybird.io", color: "from-green-400 to-emerald-300" },
];

export default function Games() {
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  let filteredGames = GAMES.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || g.desc.toLowerCase().includes(search.toLowerCase()));
  if (!sortAsc) filteredGames.reverse();

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-display font-bold text-white mb-2 flex items-center gap-3">
              <Gamepad2 className="w-10 h-10 text-primary" />
              Games Library
            </h1>
            <p className="text-muted-foreground text-lg">Play the best unblocked browser games instantly.</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search games..." 
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
            <button 
              onClick={() => {
                const randomUrl = GAMES[Math.floor(Math.random() * GAMES.length)].url;
                window.location.href = `${import.meta.env.BASE_URL}browse?url=${encodeURIComponent(randomUrl)}`;
              }}
              className="p-2.5 bg-primary border border-primary-border rounded-xl hover:bg-primary/90 text-primary-foreground transition-colors shadow-lg shadow-primary/20"
              title="Play Random Game"
            >
              <Shuffle className="w-5 h-5" />
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
          {filteredGames.map((game) => (
            <Link key={game.id} href={`/browse?url=${encodeURIComponent(game.url)}`}>
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                className="glass-card rounded-2xl overflow-hidden group cursor-pointer h-full flex flex-col hover:-translate-y-1 transition-transform duration-300"
              >
                {/* Thumbnail placeholder */}
                <div className={`h-36 w-full bg-gradient-to-br ${game.color} opacity-80 group-hover:opacity-100 transition-opacity flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <span className="text-5xl font-bold text-white/40 drop-shadow-md z-10 uppercase">{game.name.charAt(0)}</span>
                </div>
                
                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{game.name}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">{game.desc}</p>
                </div>
              </motion.div>
            </Link>
          ))}
          {filteredGames.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              <Gamepad2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-xl">No games found matching "{search}"</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
