import { Router, type IRouter, type Request, type Response } from "express";
import * as cheerio from "cheerio";

const router: IRouter = Router();

const BLOCKED_HEADERS = new Set([
  "x-frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
  "strict-transport-security",
  "cross-origin-opener-policy",
  "cross-origin-embedder-policy",
  "cross-origin-resource-policy",
  "permissions-policy",
  "report-to",
  "nel",
  "expect-ct",
  "public-key-pins",
]);

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

function rewriteCss(css: string, baseUrl: string, proxyResourceBase: string): string {
  return css
    .replace(/url\(\s*['"]?([^'")\s]+)['"]?\s*\)/g, (match, u) => {
      if (u.startsWith("data:") || u.startsWith("blob:")) return match;
      try {
        const absolute = resolveUrl(baseUrl, u);
        return `url('${proxyResourceBase}?url=${encodeURIComponent(absolute)}')`;
      } catch {
        return match;
      }
    })
    .replace(/@import\s+(['"])([^'"]+)\1/g, (match, quote, u) => {
      try {
        const absolute = resolveUrl(baseUrl, u);
        return `@import ${quote}${proxyResourceBase}?url=${encodeURIComponent(absolute)}${quote}`;
      } catch {
        return match;
      }
    })
    .replace(/@import\s+url\(\s*(['"]?)([^'")\s]+)\1\s*\)/g, (match, _q, u) => {
      try {
        const absolute = resolveUrl(baseUrl, u);
        return `@import url('${proxyResourceBase}?url=${encodeURIComponent(absolute)}')`;
      } catch {
        return match;
      }
    });
}

async function fetchWithHeaders(url: string, timeout = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Upgrade-Insecure-Requests": "1",
      },
      redirect: "follow",
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

const HTML_ERROR_PAGE = (message: string) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Proxy Error</title>
  <style>
    body { background: #0f1117; color: #fff; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; flex-direction: column; gap: 16px; }
    h2 { color: #a78bfa; margin: 0; }
    p { color: #9ca3af; margin: 0; max-width: 480px; text-align: center; }
    code { background: #1e2030; padding: 4px 8px; border-radius: 6px; color: #e879f9; font-size: 13px; }
  </style>
</head>
<body>
  <h2>⚠ Could not load page</h2>
  <p>${message.replace(/</g, "&lt;")}</p>
  <p>Some sites block server-side proxying. Try a different site or check the URL.</p>
</body>
</html>`;

function buildInjectedScript(finalUrl: string): string {
  return `<script>
(function() {
  var __BASE = '${finalUrl.replace(/'/g, "\\'")}';
  var __PROXY = '/api/proxy?url=';
  var __RPROXY = '/api/proxy/resource?url=';

  function __rewrite(url, nav) {
    if (!url) return url;
    var s = String(url);
    if (s === '' || s === '#' || s.startsWith('data:') || s.startsWith('blob:') || s.startsWith('javascript:')) return s;
    if (s.startsWith('/api/proxy')) return s;
    try {
      // Resolve ALL URLs (relative, absolute, protocol-relative) against BASE
      var abs;
      if (s.startsWith('//')) {
        abs = new URL('https:' + s).href;
      } else {
        abs = new URL(s, __BASE).href;
      }
      return (nav ? __PROXY : __RPROXY) + encodeURIComponent(abs);
    } catch(e) { return s; }
  }

  // Intercept fetch — handles ALL URL forms including /path relative
  var _fetch = window.fetch;
  window.fetch = function(input, init) {
    try {
      if (typeof input === 'string') {
        input = __rewrite(input, false);
      } else if (input && typeof input === 'object' && input.url) {
        var nu = __rewrite(input.url, false);
        if (nu !== input.url) input = new Request(nu, input);
      }
    } catch(e) {}
    return _fetch.call(this, input, init);
  };

  // Intercept XMLHttpRequest
  var _xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    var args = Array.prototype.slice.call(arguments);
    try { args[1] = __rewrite(String(args[1]), false); } catch(e) {}
    return _xhrOpen.apply(this, args);
  };

  // Intercept window.open
  var _wopen = window.open;
  window.open = function(url, target, features) {
    if (url && !String(url).startsWith('about:')) {
      try { window.location.href = __rewrite(String(url), true); return null; } catch(e) {}
    }
    return _wopen ? _wopen.apply(this, arguments) : null;
  };

  // Fix document.domain
  try {
    Object.defineProperty(document, 'domain', {
      get: function() { try { return new URL(__BASE).hostname; } catch(e) { return location.hostname; } },
      set: function() {}
    });
  } catch(e) {}

  // Report navigation changes to parent (for URL bar update)
  function _reportUrl(url) {
    try { parent.postMessage('urlchange:' + new URL(String(url), __BASE).href, '*'); } catch(e) {}
  }
  var _push = history.pushState;
  history.pushState = function(s, t, url) {
    if (url) _reportUrl(url);
    return _push.apply(this, arguments);
  };
  var _replace = history.replaceState;
  history.replaceState = function(s, t, url) {
    if (url) _reportUrl(url);
    return _replace.apply(this, arguments);
  };

  // Handle _blank link clicks
  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && el.tagName !== 'A') el = el.parentElement;
    if (!el) return;
    var href = el.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('/api/proxy')) return;
    if (el.target === '_blank') {
      e.preventDefault();
      try { window.location.href = __rewrite(href, true); } catch(ee) {}
    }
  }, true);

  // Intercept dynamic script injection
  var _createElement = document.createElement.bind(document);
  document.createElement = function(tag) {
    var el = _createElement(tag);
    if (tag.toLowerCase() === 'script') {
      var _setSrc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
      if (_setSrc && _setSrc.set) {
        try {
          Object.defineProperty(el, 'src', {
            get: function() { return _setSrc.get ? _setSrc.get.call(el) : ''; },
            set: function(v) { if (_setSrc.set) _setSrc.set.call(el, __rewrite(v, false)); }
          });
        } catch(e) {}
      }
    }
    return el;
  };
})();
</script>`;
}

router.get("/", async (req: Request, res: Response) => {
  const url = req.query.url as string;
  if (!url) {
    res.status(400).send(HTML_ERROR_PAGE("url parameter is required"));
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

    BLOCKED_HEADERS.forEach((h) => res.removeHeader(h));
    res.set("Access-Control-Allow-Origin", "*");

    if (!contentType.includes("text/html")) {
      const buffer = await upstream.arrayBuffer();
      res.set("Content-Type", contentType);
      if (contentType.includes("text/css")) {
        const css = Buffer.from(buffer).toString("utf-8");
        const rewritten = rewriteCss(css, finalUrl, "/api/proxy/resource");
        res.send(rewritten);
      } else {
        res.send(Buffer.from(buffer));
      }
      return;
    }

    const html = await upstream.text();
    const $ = cheerio.load(html);

    const proxyResourceBase = "/api/proxy/resource";
    const proxyBase = "/api/proxy";

    $("base").remove();

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
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;
      try {
        const absolute = resolveUrl(finalUrl, src);
        $(el).attr("src", rewriteUrl(absolute, proxyResourceBase));
      } catch {}
    });

    $("img[srcset]").each((_, el) => {
      const srcset = $(el).attr("srcset") || "";
      const rewritten = srcset.replace(/(\S+)(\s+\S+)?/g, (match, u, descriptor) => {
        if (u.startsWith("data:")) return match;
        try {
          const absolute = resolveUrl(finalUrl, u);
          return `${proxyResourceBase}?url=${encodeURIComponent(absolute)}${descriptor || ""}`;
        } catch {
          return match;
        }
      });
      $(el).attr("srcset", rewritten);
    });

    $("source[src]").each((_, el) => {
      const src = $(el).attr("src") || "";
      if (!src || src.startsWith("data:")) return;
      try {
        const absolute = resolveUrl(finalUrl, src);
        $(el).attr("src", rewriteUrl(absolute, proxyResourceBase));
      } catch {}
    });

    $("script[src]").each((_, el) => {
      const src = $(el).attr("src") || "";
      if (!src || src.startsWith("data:")) return;
      try {
        const absolute = resolveUrl(finalUrl, src);
        $(el).attr("src", rewriteUrl(absolute, proxyResourceBase));
      } catch {}
    });

    $("link[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (!href || href.startsWith("data:")) return;
      const rel = ($(el).attr("rel") || "").toLowerCase();
      if (
        rel.includes("stylesheet") ||
        rel.includes("icon") ||
        rel.includes("preload") ||
        rel.includes("preconnect") ||
        rel.includes("font") ||
        rel.includes("manifest")
      ) {
        try {
          const absolute = resolveUrl(finalUrl, href);
          $(el).attr("href", rewriteUrl(absolute, proxyResourceBase));
        } catch {}
      }
    });

    $("form[action]").each((_, el) => {
      const action = $(el).attr("action") || "";
      if (!action || action.startsWith("javascript:")) return;
      try {
        const absolute = resolveUrl(finalUrl, action);
        $(el).attr("action", `${proxyBase}?url=${encodeURIComponent(absolute)}`);
      } catch {}
    });

    $("[style]").each((_, el) => {
      const style = $(el).attr("style") || "";
      if (!style) return;
      const rewritten = rewriteCss(style, finalUrl, proxyResourceBase);
      $(el).attr("style", rewritten);
    });

    $("style").each((_, el) => {
      const css = $(el).html() || "";
      if (!css) return;
      $(el).html(rewriteCss(css, finalUrl, proxyResourceBase));
    });

    $("iframe[src]").each((_, el) => {
      const src = $(el).attr("src") || "";
      if (!src || src === "about:blank" || src.startsWith("javascript:") || src.startsWith("data:")) return;
      try {
        const absolute = resolveUrl(finalUrl, src);
        $(el).attr("src", `${proxyBase}?url=${encodeURIComponent(absolute)}`);
        $(el).removeAttr("sandbox");
      } catch {}
    });

    $("[data-src]").each((_, el) => {
      const src = $(el).attr("data-src") || "";
      if (!src) return;
      try {
        const absolute = resolveUrl(finalUrl, src);
        $(el).attr("data-src", rewriteUrl(absolute, proxyResourceBase));
      } catch {}
    });

    $("[data-background-image]").each((_, el) => {
      const src = $(el).attr("data-background-image") || "";
      if (!src) return;
      try {
        const absolute = resolveUrl(finalUrl, src);
        $(el).attr("data-background-image", rewriteUrl(absolute, proxyResourceBase));
      } catch {}
    });

    $("head").prepend(buildInjectedScript(finalUrl));

    res.set("Content-Type", "text/html; charset=utf-8");
    res.send($.html());
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(200).send(HTML_ERROR_PAGE(message));
  }
});

router.get("/resource", async (req: Request, res: Response) => {
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
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);

    let origin = "";
    try { origin = new URL(targetUrl).origin; } catch {}

    const upstream = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        ...(origin ? { Referer: origin + "/", Origin: origin } : {}),
      },
      redirect: "follow",
    }).finally(() => clearTimeout(timer));

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const finalUrl = upstream.url || targetUrl;
    const buffer = await upstream.arrayBuffer();

    BLOCKED_HEADERS.forEach((h) => res.removeHeader(h));
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Cache-Control", "public, max-age=3600");

    if (contentType.includes("text/css")) {
      const css = Buffer.from(buffer).toString("utf-8");
      const rewritten = rewriteCss(css, finalUrl, "/api/proxy/resource");
      res.set("Content-Type", "text/css; charset=utf-8");
      res.send(rewritten);
    } else if (contentType.includes("text/javascript") || contentType.includes("application/javascript") || contentType.includes("application/x-javascript")) {
      res.set("Content-Type", contentType);
      res.send(Buffer.from(buffer));
    } else {
      res.set("Content-Type", contentType);
      res.send(Buffer.from(buffer));
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "resource_error", message });
  }
});

export default router;
