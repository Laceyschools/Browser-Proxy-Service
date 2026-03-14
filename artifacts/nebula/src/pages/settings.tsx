import { useState } from "react";
import { Shield, EyeOff, Search, Settings as SettingsIcon, AlertTriangle, Monitor, ExternalLink } from "lucide-react";
import { useSettings, type SearchEngine } from "@/store/use-settings";
import { cn } from "@/lib/utils";

export default function Settings() {
  const settings = useSettings();
  const [aboutBlankUrl, setAboutBlankUrl] = useState("https://google.com");

  const openAboutBlank = () => {
    let win = window.open();
    if (!win) {
      alert("Popup blocker prevented opening about:blank");
      return;
    }
    win.document.body.style.margin = "0";
    win.document.body.style.height = "100vh";
    let iframe = win.document.createElement("iframe");
    iframe.style.border = "none";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.margin = "0";
    iframe.src = `${window.location.origin}${import.meta.env.BASE_URL}browse?url=${encodeURIComponent(aboutBlankUrl)}`;
    win.document.body.appendChild(iframe);
    window.location.replace("https://google.com");
  };

  const applyPreset = (title: string, icon: string) => {
    settings.setCloakTitle(title);
    settings.setCloakIcon(icon);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 md:p-8 bg-background">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <SettingsIcon className="w-10 h-10 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground text-lg">Customize your proxy and privacy preferences.</p>
        </div>

        <div className="space-y-8 pb-20">
          {/* Privacy & Cloaking */}
          <section className="glass-panel rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <EyeOff className="w-6 h-6 text-accent" />
              <h2 className="text-2xl font-display font-bold text-white">Privacy & Cloaking</h2>
            </div>

            <div className="space-y-8">
              {/* About Blank Cloak */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white flex items-center justify-between">
                  <span>About:Blank Cloak</span>
                </label>
                <p className="text-sm text-muted-foreground">Opens the proxy in an about:blank popup to hide from extensions.</p>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={aboutBlankUrl}
                    onChange={(e) => setAboutBlankUrl(e.target.value)}
                    placeholder="Enter URL to open..." 
                    className="flex-1 bg-secondary/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                  <button 
                    onClick={openAboutBlank}
                    className="px-6 py-2.5 bg-accent text-accent-foreground font-semibold rounded-xl hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20 flex items-center gap-2"
                  >
                    Open <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tab Cloak */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Tab Cloaking</h3>
                    <p className="text-sm text-muted-foreground">Change the tab title and favicon to hide activity.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={settings.tabCloakEnabled} onChange={(e) => settings.setTabCloakEnabled(e.target.checked)} />
                    <div className="w-14 h-7 bg-secondary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {settings.tabCloakEnabled && (
                  <div className="bg-secondary/30 rounded-xl p-4 border border-white/5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Tab Title</label>
                        <input 
                          type="text" 
                          value={settings.cloakTitle}
                          onChange={(e) => settings.setCloakTitle(e.target.value)}
                          className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-primary/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Favicon URL</label>
                        <input 
                          type="text" 
                          value={settings.cloakIcon}
                          onChange={(e) => settings.setCloakIcon(e.target.value)}
                          className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-primary/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">Presets</label>
                      <div className="flex gap-2">
                        <button onClick={() => applyPreset("Google", "https://www.google.com/favicon.ico")} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-md border border-white/10 text-white transition-colors">Google</button>
                        <button onClick={() => applyPreset("My Drive - Google Drive", "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png")} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-md border border-white/10 text-white transition-colors">Google Drive</button>
                        <button onClick={() => applyPreset("Classes", "https://ssl.gstatic.com/classroom/favicon.png")} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-md border border-white/10 text-white transition-colors">Classroom</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tab Switch Cloak */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div>
                  <h3 className="text-white font-medium">Tab Switch Cloaking</h3>
                  <p className="text-sm text-muted-foreground">Only cloak when you switch to another tab.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings.tabSwitchCloak} onChange={(e) => settings.setTabSwitchCloak(e.target.checked)} />
                  <div className="w-14 h-7 bg-secondary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Panic Key */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div>
                  <h3 className="text-white font-medium">Panic Key</h3>
                  <p className="text-sm text-muted-foreground">Press a key to instantly redirect to a safe page.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Key</label>
                    <input 
                      type="text" 
                      maxLength={1}
                      value={settings.panicKey}
                      onChange={(e) => settings.setPanicKey(e.target.value)}
                      className="w-full bg-secondary/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Redirect URL</label>
                    <input 
                      type="text" 
                      value={settings.panicUrl}
                      onChange={(e) => settings.setPanicUrl(e.target.value)}
                      className="w-full bg-secondary/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-primary/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Browsing */}
          <section className="glass-panel rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <Search className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-display font-bold text-white">Browsing</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-white font-medium">Search Engine</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['duckduckgo', 'google', 'bing', 'brave'] as SearchEngine[]).map((engine) => (
                    <button
                      key={engine}
                      onClick={() => settings.setSearchEngine(engine)}
                      className={cn(
                        "px-4 py-3 rounded-xl border text-sm font-medium capitalize transition-all",
                        settings.searchEngine === engine 
                          ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                          : "bg-secondary/30 border-white/10 text-muted-foreground hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {engine}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div>
                  <h3 className="text-white font-medium flex items-center gap-2">
                    Ad Blocker 
                    <span className="text-[10px] uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">Experimental</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">Block tracking scripts and ads (server-side support required).</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings.adBlocker} onChange={(e) => settings.setAdBlocker(e.target.checked)} />
                  <div className="w-14 h-7 bg-secondary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div>
                  <h3 className="text-white font-medium">Anti-close Prevention</h3>
                  <p className="text-sm text-muted-foreground">Show a confirmation dialog before closing the tab.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings.antiClose} onChange={(e) => settings.setAntiClose(e.target.checked)} />
                  <div className="w-14 h-7 bg-secondary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Advanced */}
          <section className="glass-panel border-destructive/20 rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <h2 className="text-2xl font-display font-bold text-white">Advanced</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-medium">Clear All Data</h3>
                <p className="text-sm text-muted-foreground">Resets all settings to default. This action cannot be undone.</p>
              </div>
              <button 
                onClick={() => {
                  if (confirm("Are you sure you want to clear all settings? This cannot be undone.")) {
                    settings.clearAllData();
                  }
                }}
                className="px-6 py-2.5 bg-destructive/10 text-destructive border border-destructive/20 font-semibold rounded-xl hover:bg-destructive hover:text-white transition-colors"
              >
                Clear Data
              </button>
            </div>
          </section>

          {/* About */}
          <section className="text-center py-8 opacity-60">
            <Monitor className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-display font-bold text-xl text-white">Nebula Browser</h3>
            <p className="text-sm text-muted-foreground mb-1">Version v1.0.0</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              A sleek, secure, and customizable proxy environment designed for privacy and speed.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
