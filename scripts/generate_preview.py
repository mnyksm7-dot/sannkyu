#!/usr/bin/env python3
"""
articles/*.md から投稿補助ダッシュボード (preview.html) を生成する。

note.com には外部からの自動投稿APIが存在しないため、これは完全自動化ではなく
「コピペの手間を最小化する」ためのダッシュボード。
"""
import html
import json
import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
ARTICLES_DIR = ROOT / "articles"
THUMBS_DIR = ROOT / "thumbnails"
OUT_PATH = ROOT / "preview.html"

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n(.*)$", re.DOTALL)
PAID_CUT_MARK = "<!-- PAID_CUT -->"


def load_article(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    m = FRONTMATTER_RE.match(text)
    if not m:
        raise ValueError(f"frontmatter not found: {path}")
    meta = yaml.safe_load(m.group(1)) or {}
    body = m.group(2).strip()

    if PAID_CUT_MARK in body:
        free_body, paid_body = body.split(PAID_CUT_MARK, 1)
    else:
        free_body, paid_body = body, ""

    return {
        "slug": path.stem,
        "title": meta.get("title", path.stem),
        "price": meta.get("price", 0),
        "tags": meta.get("tags", []),
        "free_body": free_body.strip(),
        "paid_body": paid_body.strip(),
        "char_count": len(body.replace("\n", "").replace(" ", "")),
    }


def markdown_to_html(md_text: str) -> str:
    """簡易Markdown変換(見出し・太字・段落のみ)。凝った変換は行わない。"""
    lines = md_text.split("\n")
    out = []
    for line in lines:
        line = line.rstrip()
        if not line:
            out.append("")
            continue
        if line.startswith("## "):
            out.append(f"<h3>{html.escape(line[3:])}</h3>")
        elif line.startswith("# "):
            out.append(f"<h2>{html.escape(line[2:])}</h2>")
        else:
            escaped = html.escape(line)
            escaped = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", escaped)
            out.append(f"<p>{escaped}</p>")
    return "\n".join(out)


def markdown_to_plain(md_text: str) -> str:
    """note本文コピー用のプレーンテキスト(見出し記号やMarkdown記法を除去)。"""
    lines = md_text.split("\n")
    out = []
    for line in lines:
        line = line.strip()
        line = re.sub(r"^#+\s*", "", line)
        line = re.sub(r"\*\*(.+?)\*\*", r"\1", line)
        out.append(line)
    return "\n".join(out).strip()


def build_card(article: dict, index: int) -> str:
    slug = article["slug"]
    thumb_path = THUMBS_DIR / f"{slug}.png"
    thumb_rel = f"thumbnails/{slug}.png" if thumb_path.exists() else ""
    tags_html = "".join(
        f'<span class="tag">{html.escape(t)}</span>' for t in article["tags"]
    )

    free_html = markdown_to_html(article["free_body"])
    paid_html = markdown_to_html(article["paid_body"]) if article["paid_body"] else ""

    paid_banner = (
        '<div class="paid-banner">🔒 ここから先は有料エリア</div>' if paid_html else ""
    )

    body_plain = markdown_to_plain(article["free_body"])
    if article["paid_body"]:
        body_plain += "\n\n▼▼▼ ここから有料エリア ▼▼▼\n\n" + markdown_to_plain(
            article["paid_body"]
        )

    title_js = json.dumps(article["title"], ensure_ascii=False)
    body_js = json.dumps(body_plain, ensure_ascii=False)

    thumb_html = (
        f'<img class="thumb" src="{thumb_rel}" alt="{html.escape(article["title"])}">'
        if thumb_rel
        else '<div class="thumb thumb-placeholder">サムネイル未生成</div>'
    )

    return f"""
  <section class="card" id="art-{index:02d}" data-slug="{slug}">
    <div class="card-head">
      {thumb_html}
      <div class="card-meta">
        <div class="tags">{tags_html}</div>
        <h2 class="title">{html.escape(article["title"])}</h2>
        <div class="sub">
          <span class="price">¥{article["price"]}</span>
          <span class="chars">約{article["char_count"]}字</span>
        </div>
        <label class="posted-check">
          <input type="checkbox" onchange="togglePosted('{slug}', this.checked)" data-slug="{slug}">
          投稿済みにする
        </label>
      </div>
    </div>

    <div class="actions">
      <button onclick='copyText({title_js})'>タイトルをコピー</button>
      <button onclick='copyText({body_js})'>本文をコピー</button>
      <a class="btn-link" href="https://note.com/notes/new" target="_blank" rel="noopener">noteで新規投稿を開く</a>
      {f'<a class="btn-link" href="{thumb_rel}" target="_blank" rel="noopener">サムネイルを開く</a>' if thumb_rel else ''}
    </div>

    <div class="body-preview">
      {free_html}
      {paid_banner}
      {paid_html}
    </div>
  </section>
"""


def build_nav(articles: list[dict]) -> str:
    items = "".join(
        f'<a href="#art-{i:02d}">#{i:02d}</a>' for i in range(1, len(articles) + 1)
    )
    return f'<nav class="topnav">{items}</nav>'


def main():
    md_files = sorted(ARTICLES_DIR.glob("*.md"))
    articles = [load_article(p) for p in md_files]

    cards = "\n".join(build_card(a, i + 1) for i, a in enumerate(articles))
    nav = build_nav(articles)
    total = len(articles)

    html_out = f"""<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>note投稿ダッシュボード</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {{ color-scheme: light dark; }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0;
    font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif;
    background: #f4f5f7;
    color: #1c1c1e;
    padding-bottom: 80px;
  }}
  header {{
    background: #1c1c1e;
    color: #fff;
    padding: 20px 24px;
    position: sticky;
    top: 0;
    z-index: 10;
  }}
  header h1 {{ margin: 0 0 4px; font-size: 20px; }}
  header .progress {{ font-size: 14px; color: #ccc; }}
  .topnav {{
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }}
  .topnav a {{
    color: #fff;
    background: #333;
    padding: 4px 10px;
    border-radius: 6px;
    text-decoration: none;
    font-size: 13px;
  }}
  .topnav a:hover {{ background: #555; }}
  main {{
    max-width: 820px;
    margin: 24px auto;
    padding: 0 16px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }}
  .card {{
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }}
  .card.posted {{ opacity: 0.45; }}
  .card-head {{
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }}
  .thumb {{
    width: 280px;
    max-width: 100%;
    aspect-ratio: 1280 / 670;
    object-fit: cover;
    border-radius: 8px;
    background: #ddd;
  }}
  .thumb-placeholder {{
    display: flex;
    align-items: center;
    justify-content: center;
    color: #888;
    font-size: 13px;
  }}
  .card-meta {{ flex: 1; min-width: 220px; }}
  .tags {{ margin-bottom: 6px; }}
  .tag {{
    display: inline-block;
    background: #eef0f3;
    color: #444;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 999px;
    margin-right: 4px;
  }}
  .title {{ margin: 4px 0; font-size: 18px; line-height: 1.4; }}
  .sub {{ font-size: 14px; color: #555; display: flex; gap: 12px; }}
  .price {{ font-weight: 700; color: #c9436e; }}
  .posted-check {{ display: block; margin-top: 10px; font-size: 13px; }}
  .actions {{
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 16px 0;
  }}
  .actions button, .btn-link {{
    border: 1px solid #ccc;
    background: #fafafa;
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    text-decoration: none;
    color: #1c1c1e;
  }}
  .actions button:hover, .btn-link:hover {{ background: #eee; }}
  .body-preview {{
    border-top: 1px solid #eee;
    padding-top: 12px;
    font-size: 15px;
    line-height: 1.9;
  }}
  .body-preview h2 {{ font-size: 19px; margin: 20px 0 10px; }}
  .body-preview h3 {{ font-size: 16px; margin: 16px 0 8px; }}
  .body-preview p {{ margin: 8px 0; }}
  .paid-banner {{
    background: #fff3e0;
    color: #e85d04;
    border: 1px dashed #e85d04;
    border-radius: 8px;
    padding: 10px 14px;
    margin: 18px 0;
    font-weight: 700;
    text-align: center;
  }}
  .toast {{
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #1c1c1e;
    color: #fff;
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 13px;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
  }}
  .toast.show {{ opacity: 1; }}
  @media (prefers-color-scheme: dark) {{
    body {{ background: #121212; color: #eee; }}
    .card {{ background: #1e1e1e; box-shadow: none; }}
    .tag {{ background: #2a2a2a; color: #ccc; }}
    .sub {{ color: #aaa; }}
    .body-preview {{ border-color: #333; }}
    .actions button, .btn-link {{ background: #2a2a2a; border-color: #444; color: #eee; }}
  }}
</style>
</head>
<body>
<header>
  <h1>note投稿ダッシュボード</h1>
  <div class="progress" id="progress">投稿済み: 0 / {total}</div>
  {nav}
</header>
<main>
{cards}
</main>
<div class="toast" id="toast">コピーしました</div>

<script>
const STORAGE_KEY = "note_dashboard_posted";

function getPosted() {{
  try {{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{{}}"); }}
  catch {{ return {{}}; }}
}}

function setPosted(state) {{
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}}

function updateProgress() {{
  const state = getPosted();
  const total = document.querySelectorAll(".card").length;
  const done = Object.values(state).filter(Boolean).length;
  document.getElementById("progress").textContent = `投稿済み: ${{done}} / ${{total}}`;
}}

function togglePosted(slug, checked) {{
  const state = getPosted();
  state[slug] = checked;
  setPosted(state);
  const card = document.querySelector(`.card[data-slug="${{slug}}"]`);
  if (card) card.classList.toggle("posted", checked);
  updateProgress();
}}

function restorePostedState() {{
  const state = getPosted();
  document.querySelectorAll(".card").forEach((card) => {{
    const slug = card.dataset.slug;
    const checked = !!state[slug];
    const input = card.querySelector('input[type="checkbox"]');
    if (input) input.checked = checked;
    card.classList.toggle("posted", checked);
  }});
  updateProgress();
}}

function copyText(text) {{
  navigator.clipboard.writeText(text).then(() => {{
    const toast = document.getElementById("toast");
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1200);
  }});
}}

restorePostedState();
</script>
</body>
</html>
"""

    OUT_PATH.write_text(html_out, encoding="utf-8")
    print(f"generated: {OUT_PATH}")


if __name__ == "__main__":
    main()
