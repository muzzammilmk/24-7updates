require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const Parser = require("rss-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const parser = new Parser({ timeout: 12000, headers: { "User-Agent": "24-7Updates/1.0 news-reader" } });
const DATA_DIR = path.join(__dirname, "data");
const POSTS_FILE = path.join(DATA_DIR, "posts.json");
fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(POSTS_FILE)) fs.writeFileSync(POSTS_FILE, "[]", "utf8");

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || "change-this-secret-before-deploying",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, "public")));

const FEEDS = [
  { category: "Duniya", name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { category: "Wasanni", name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/rss.xml?edition=uk" },
  { category: "Wasanni", name: "ESPN", url: "https://www.espn.com/espn/rss/news" },
  { category: "Fasaha", name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
  { category: "Nishaɗi", name: "The Guardian Culture", url: "https://www.theguardian.com/culture/rss" }
];

function readPosts() {
  try { return JSON.parse(fs.readFileSync(POSTS_FILE, "utf8")); } catch { return []; }
}
function writePosts(posts) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), "utf8");
}
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin === true) return next();
  return res.status(401).json({ error: "Dole ne ka shiga asusun admin." });
}

app.get("/api/news", async (req, res) => {
  const category = (req.query.category || "").toLowerCase();
  const manual = readPosts().map(p => ({ ...p, source: "24/7Updates", manual: true }));
  const feedResults = await Promise.allSettled(FEEDS.map(async feed => {
    const parsed = await parser.parseURL(feed.url);
    return (parsed.items || []).slice(0, 12).map(item => ({
      id: `${feed.name}-${item.guid || item.link || item.title}`,
      title: item.title || "Sabon labari",
      description: (item.contentSnippet || item.summary || "").replace(/<[^>]*>/g, "").slice(0, 320),
      url: item.link || "#",
      image: item.enclosure && item.enclosure.url ? item.enclosure.url : "",
      category: feed.category,
      source: feed.name,
      date: item.isoDate || item.pubDate || new Date().toISOString(),
      manual: false
    }));
  }));
  const automatic = feedResults.flatMap(r => r.status === "fulfilled" ? r.value : []);
  let all = [...manual, ...automatic];
  if (category && category !== "duk" && category !== "all") {
    all = all.filter(n => (n.category || "").toLowerCase() === category);
  }
  all.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  res.set("Cache-Control", "public, max-age=120");
  res.json({ items: all.slice(0, 80), automaticSources: FEEDS.map(f => ({name:f.name, category:f.category})), updatedAt: new Date().toISOString() });
});

app.post("/api/admin/login", (req, res) => {
  const password = String(req.body.password || "");
  const expected = process.env.ADMIN_PASSWORD || "change-this-password";
  if (expected === "change-this-password" || password !== expected) {
    return res.status(401).json({ error: "Ba a karɓi kalmar sirri ba. Mai gidan website ya saita ADMIN_PASSWORD a hosting." });
  }
  req.session.admin = true;
  res.json({ ok: true });
});
app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});
app.get("/api/admin/me", (req, res) => res.json({ loggedIn: !!(req.session && req.session.admin) }));
app.post("/api/admin/posts", requireAdmin, (req, res) => {
  const { title, description, category, image, url } = req.body || {};
  if (!title || !description || !category) return res.status(400).json({ error: "Cika kanun labari, bayani da rukuni." });
  const posts = readPosts();
  const post = {
    id: `manual-${Date.now()}`,
    title: String(title).slice(0, 180),
    description: String(description).slice(0, 3000),
    category: String(category).slice(0, 60),
    image: String(image || "").slice(0, 1000),
    url: String(url || "").slice(0, 1000),
    source: "24/7Updates",
    date: new Date().toISOString(),
    manual: true
  };
  posts.unshift(post);
  writePosts(posts);
  res.json({ ok: true, post });
});
app.delete("/api/admin/posts/:id", requireAdmin, (req, res) => {
  const posts = readPosts();
  const updated = posts.filter(p => p.id !== req.params.id);
  if (updated.length === posts.length) return res.status(404).json({ error: "Ba a sami labarin ba." });
  writePosts(updated);
  res.json({ ok: true });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`24/7Updates is running on port ${PORT}`));
