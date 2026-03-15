import { Router, type IRouter, type Request, type Response } from "express";
import * as cheerio from "cheerio";

const router: IRouter = Router();

const GN_MATH_BASE = "https://gn-math.dev";

interface Game {
  id: string;
  title: string;
  url: string;
  thumbnail: string | null;
  description: string;
  category: string;
}

let cachedGames: Game[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000;

async function fetchGames(): Promise<Game[]> {
  if (cachedGames && Date.now() - cacheTime < CACHE_TTL) {
    return cachedGames;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(GN_MATH_BASE, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    clearTimeout(timer);
    const html = await res.text();
    const $ = cheerio.load(html);

    const games: Game[] = [];
    const seen = new Set<string>();

    const selectors = [
      "a[href*='/game']",
      "a[href*='/play']",
      ".game-card",
      ".game-item",
      ".game",
      "[class*='game']",
      "a[href]",
    ];

    for (const selector of selectors) {
      $(selector).each((_, el) => {
        const $el = $(el);
        const href = $el.attr("href") || $el.find("a").attr("href") || "";
        if (!href || href === "/" || href === "#") return;

        let absoluteUrl: string;
        try {
          absoluteUrl = new URL(href, GN_MATH_BASE).href;
        } catch {
          return;
        }

        if (!absoluteUrl.startsWith(GN_MATH_BASE)) return;
        if (seen.has(absoluteUrl)) return;

        const title =
          $el.attr("title") ||
          $el.find("h1, h2, h3, h4, .title, .name, [class*='title'], [class*='name']").first().text().trim() ||
          $el.text().trim() ||
          href.split("/").filter(Boolean).pop()?.replace(/-/g, " ") ||
          "";

        if (!title || title.length < 2) return;
        if (title.toLowerCase().includes("cookie") || title.toLowerCase().includes("privacy")) return;

        seen.add(absoluteUrl);

        const img =
          $el.find("img").attr("src") ||
          $el.find("img").attr("data-src") ||
          $el.attr("data-thumbnail") ||
          null;

        let thumbnail: string | null = null;
        if (img) {
          try {
            thumbnail = new URL(img, GN_MATH_BASE).href;
          } catch {
            thumbnail = img;
          }
        }

        const description =
          $el.find("p, .description, .desc, [class*='desc']").first().text().trim() ||
          $el.attr("data-description") ||
          "";

        const pathParts = new URL(absoluteUrl).pathname.split("/").filter(Boolean);
        const category = pathParts.length > 1 ? pathParts[0] : "Math Games";

        games.push({
          id: Buffer.from(absoluteUrl).toString("base64").slice(0, 16),
          title: title.substring(0, 80),
          url: absoluteUrl,
          thumbnail,
          description: description.substring(0, 200),
          category,
        });
      });

      if (games.length > 5) break;
    }

    if (games.length === 0) {
      cachedGames = getFallbackGames();
    } else {
      const seen2 = new Set<string>();
      cachedGames = games.filter(g => {
        if (seen2.has(g.url)) return false;
        seen2.add(g.url);
        return true;
      });
    }

    cacheTime = Date.now();
    return cachedGames;
  } catch {
    clearTimeout(timer);
    if (cachedGames) return cachedGames;
    return getFallbackGames();
  }
}

function getFallbackGames(): Game[] {
  return [
    {
      id: "gn1",
      title: "Math Blaster",
      url: `${GN_MATH_BASE}/`,
      thumbnail: null,
      description: "Blast through math challenges and improve your skills",
      category: "Arithmetic",
    },
    {
      id: "gn2",
      title: "Number Ninja",
      url: `${GN_MATH_BASE}/`,
      thumbnail: null,
      description: "Slice numbers and solve equations at lightning speed",
      category: "Arithmetic",
    },
    {
      id: "gn3",
      title: "Fraction Wars",
      url: `${GN_MATH_BASE}/`,
      thumbnail: null,
      description: "Battle with fractions and come out on top",
      category: "Fractions",
    },
    {
      id: "gn4",
      title: "Algebra Quest",
      url: `${GN_MATH_BASE}/`,
      thumbnail: null,
      description: "Embark on an algebra adventure",
      category: "Algebra",
    },
    {
      id: "gn5",
      title: "Geometry Dash Math",
      url: `${GN_MATH_BASE}/`,
      thumbnail: null,
      description: "Navigate geometric obstacles while solving problems",
      category: "Geometry",
    },
    {
      id: "gn6",
      title: "Times Table Challenge",
      url: `${GN_MATH_BASE}/`,
      thumbnail: null,
      description: "Master your multiplication tables",
      category: "Multiplication",
    },
  ];
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const games = await fetchGames();
    res.json({ games });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "games_error", message });
  }
});

export default router;
