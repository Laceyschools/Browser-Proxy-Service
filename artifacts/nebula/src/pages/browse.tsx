import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Globe, ArrowLeft, ArrowRight, RotateCw, Search, Maximize, Lock } from "lucide-react";
import { useSettings } from "@/store/use-settings";

export default function Browse() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialUrl = searchParams.get('url') || '';
  
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [iframeSrc, setIframeSrc] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const settings = useSettings();

  const loadProxyUrl = (rawTarget: string) => {
    if (!rawTarget) return;
    
    let target = rawTarget.trim();
    // Logic to determine if search or URL
    if (!/^https?:\/\//i.test(target) && !/^[a-z0-9-]+\.[a-z]{2,}/i.test(target)) {
      if (settings.searchEngine === 'google') target = `https://www.google.com/search?q=${encodeURIComponent(target)}`;
      else if (settings.searchEngine === 'duckduckgo') target = `https://duckduckgo.com/?q=${encodeURIComponent(target)}`;
      else if (settings.searchEngine === 'bing') target = `https://www.bing.com/search?q=${encodeURIComponent(target)}`;
      else if (settings.searchEngine === 'brave') target = `https://search.brave.com/search?q=${encodeURIComponent(target)}`;
    } else if (!/^https?:\/\//i.test(target)) {
      target = `https://${target}`;
    }

    setInputUrl(target);
    setIsLoading(true);
    // Standard proxy endpoint logic based on API spec
    setIframeSrc(`/api/proxy?url=${encodeURIComponent(target)}`);
  };

  useEffect(() => {
    if (initialUrl) {
      loadProxyUrl(initialUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (typeof e.data === "string" && e.data.startsWith("urlchange:")) {
        const newUrl = e.data.slice("urlchange:".length);
        setInputUrl(newUrl);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProxyUrl(inputUrl);
  };

  const handleReload = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      // Force reload by resetting src
      const current = iframeRef.current.src;
      iframeRef.current.src = 'about:blank';
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.src = current;
      }, 50);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      iframeRef.current?.requestFullscreen().catch(err => {
        console.error("Error attempting to enable full-screen mode:", err.message);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background relative">
      {/* Browser Chrome */}
      <div className="h-16 flex-shrink-0 border-b border-white/5 bg-secondary/80 backdrop-blur-md flex items-center px-4 gap-3 z-10">
        <div className="flex items-center gap-1">
          <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50">
            <ArrowRight className="w-5 h-5" />
          </button>
          <button 
            onClick={handleReload}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>

        <form 
          onSubmit={handleSubmit}
          className="flex-1 max-w-3xl mx-auto flex items-center h-10 bg-black/40 border border-white/10 rounded-xl px-4 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all"
        >
          <Lock className="w-4 h-4 text-emerald-400 mr-3" />
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Search or enter URL"
            className="flex-1 bg-transparent border-none outline-none text-sm text-white"
          />
          {isLoading && (
            <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin ml-3" />
          )}
        </form>

        <div className="flex items-center gap-2">
          <button 
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
            title="Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div className="flex-1 relative bg-black">
        {!iframeSrc && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <Globe className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">Enter a URL to start browsing securely</p>
          </div>
        )}
        {iframeSrc && (
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            className="w-full h-full border-none bg-white"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation"
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
          />
        )}
      </div>
    </div>
  );
}
