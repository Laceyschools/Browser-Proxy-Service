import { Router, type IRouter, type Request, type Response } from "express";
import * as cheerio from "cheerio";

const router: IRouter = Router();

function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

function rewriteUrl(url: string, proxyBase: string): string {
  if (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("javascript:") ||
    url.startsWith("#") ||
    url.trim() === ""
  ) {
    return url;
  }
  return `${proxyBase}?url=${encodeURIComponent(url)}`;
}

async function fetchWithHeaders(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    redirect: "follow",
  });
  return res;
}

router.get("/", async (req: Request, res: Response) => {
  const url = req.query.url as string;
  if (!url) {
    res.status(400).json({ error: "bad_request", message: "url parameter is required" });
    return;
  }

  let targetUrl = url;
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = "https://" + targetUrl;
  }

  try {
    const upstream = await fetchWithHeaders(targetUrl);
    const finalUrl = upstream.url || targetUrl;
    const contentType = upstream.headers.get("content-type") || "";

    if (!contentType.includes("text/html")) {
      const buffer = await upstream.arrayBuffer();
      res.set("Content-Type", contentType);
      res.set("Access-Control-Allow-Origin", "*");
      res.send(Buffer.from(buffer));
      return;
    }

    const html = await upstream.text();
    const $ = cheerio.load(html);

    const proxyResourceBase = "/api/proxy/resource";
    const proxyBase = "/api/proxy";

    $("base").remove();
    $("head").prepend(`<base href="${finalUrl}">`);

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      )
        return;
      try {
        const absolute = resolveUrl(finalUrl, href);
        $(el).attr("href", `${proxyBase}?url=${encodeURIComponent(absolute)}`);
        $(el).attr("target", "_self");
      } catch {}
    });

    $("img[src]").each((_, el) => {
      const src = $(el).attr("src") || "";
      try {
        const absolute = resolveUrl(finalUrl, src);
        $(el).attr("src", rewriteUrl(absolute, proxyResourceBase));
      } catch {}
    });

    $("script[src]").each((_, el) => {
      const src = $(el).attr("src") || "";
      try {
        const absolute = resolveUrl(finalUrl, src);
        $(el).attr("src", rewriteUrl(absolute, proxyResourceBase));
      } catch {}
    });

    $("link[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      const rel = $(el).attr("rel") || "";
      if (rel.includes("stylesheet") || rel.includes("icon") || rel.includes("preload")) {
        try {
          const absolute = resolveUrl(finalUrl, href);
          $(el).attr("href", rewriteUrl(absolute, proxyResourceBase));
        } catch {}
      }
    });

    $("form[action]").each((_, el) => {
      const action = $(el).attr("action") || "";
      try {
        const absolute = resolveUrl(finalUrl, action);
        $(el).attr("action", `${proxyBase}?url=${encodeURIComponent(absolute)}`);
      } catch {}
    });

    $("[style]").each((_, el) => {
      const style = $(el).attr("style") || "";
      const rewritten = style.replace(/url\(['"]?([^'"()]+)['"]?\)/g, (match, u) => {
        try {
          const absolute = resolveUrl(finalUrl, u);
          return `url('${rewriteUrl(absolute, proxyResourceBase)}')`;
        } catch {
          return match;
        }
      });
      $(el).attr("style", rewritten);
    });

    $("iframe[src]").each((_, el) => {
      const src = $(el).attr("src") || "";
      try {
        const absolute = resolveUrl(finalUrl, src);
        $(el).attr("src", `${proxyBase}?url=${encodeURIComponent(absolute)}`);
      } catch {}
    });

    const inject = `
<script>
(function() {
  var _open = window.open;
  window.open = function(url, target, features) {
    if (url && url !== '_blank') {
      window.location.href = '/api/proxy?url=' + encodeURIComponent(url);
      return null;
    }
    return _open.apply(this, arguments);
  };
  document.addEventListener('click', function(e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (a && a.target === '_blank') {
      e.preventDefault();
      var href = a.getAttribute('href');
      if (href) window.location.href = href;
    }
  }, true);
})();
</script>`;

    $("body").append(inject);

    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Access-Control-Allow-Origin", "*");
    res.set("X-Frame-Options", "SAMEORIGIN");
    res.send($.html());
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "proxy_error", message });
  }
});

router.get("/resource", async (req: Request, res: Response) => {
  const url = req.query.url as string;
  if (!url) {
    res.status(400).json({ error: "bad_request", message: "url parameter is required" });
    return;
  }

  try {
    const upstream = await fetchWithHeaders(url);
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const buffer = await upstream.arrayBuffer();

    res.set("Content-Type", contentType);
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(Buffer.from(buffer));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "resource_error", message });
  }
});

export default router;
