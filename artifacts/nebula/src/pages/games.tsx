import { useEffect, useRef } from "react";

const GN_MATH_URL = "https://gn-math.dev";

export default function Games() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (typeof e.data === "string" && e.data.startsWith("navigate:")) {
        const url = e.data.slice("navigate:".length);
        if (iframeRef.current) {
          iframeRef.current.src = `/api/proxy?url=${encodeURIComponent(url)}`;
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <iframe
        ref={iframeRef}
        src={`/api/proxy?url=${encodeURIComponent(GN_MATH_URL)}`}
        className="w-full flex-1 border-none"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation"
        style={{ height: "100%", minHeight: 0 }}
      />
    </div>
  );
}
