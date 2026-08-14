"""
Live MyScheme Web Scraper & Crawler (Playwright-based).

Scrapes live JavaScript-rendered pages from https://www.myscheme.gov.in/schemes/<slug>,
extracts all 8 rich content sections, and saves them to:
1. `knowledge/raw_dumps/<slug>.txt`
2. `knowledge/schemes/<slug>.md` (OKF Canonical Markdown)
3. PostgreSQL relational tables.
"""

import asyncio
from pathlib import Path
import sys
from typing import Any

from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

from app.database import SessionLocal
from app.modules.ingestion.myscheme_scraper import (
    parse_myscheme_text_or_markdown,
    save_parsed_scheme_to_db_and_okf,
)


async def scrape_myscheme_page(slug_or_url: str) -> str:
    """
    Launches headless Chromium to render the client-side Next.js page on MyScheme.gov.in
    and extracts full rendered text and structured markdown.
    """
    url = slug_or_url if slug_or_url.startswith("http") else f"https://www.myscheme.gov.in/schemes/{slug_or_url}"

    async with async_playwright() as p:
        # Use locally installed google-chrome or fallback to playwright chromium
        chrome_path = "/home/neon/.local/bin/google-chrome"
        launch_kwargs = {"headless": True, "args": ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]}
        if Path(chrome_path).exists():
            launch_kwargs["executable_path"] = chrome_path

        browser = await p.chromium.launch(**launch_kwargs)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
        )
        page = await context.new_page()

        try:
            print(f"[*] Navigating to: {url}")
            await page.goto(url, wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)

            # Get main container text & h1 title
            content_html = await page.content()
            soup = BeautifulSoup(content_html, "html.parser")

            h1_el = soup.find("h1")
            h1_title = h1_el.get_text(strip=True) if h1_el else ""

            # Extract main content
            main_el = soup.find("main") or soup.find("div", class_=lambda c: c and "container" in c)
            if main_el:
                extracted_text = main_el.get_text(separator="\n", strip=True)
            else:
                extracted_text = soup.get_text(separator="\n", strip=True)

            if h1_title:
                extracted_text = f"{h1_title}\n\n{extracted_text}"

            return extracted_text
        finally:
            await browser.close()


async def scrape_and_ingest_scheme(
    slug_or_url: str,
    raw_dump_dir: Path = Path("/home/neon/programs/side_project/scheme-backend/knowledge/raw_dumps"),
) -> dict[str, Any]:
    """
    Scrapes a single MyScheme webpage live, parses all 8 sections, and dumps to DB & OKF.
    """
    raw_dump_dir.mkdir(parents=True, exist_ok=True)
    slug = slug_or_url.split("/")[-1].split("?")[0]

    print(f"\n[1/3] Starting live scrape for '{slug}' from MyScheme.gov.in...")
    raw_text = await scrape_myscheme_page(slug_or_url)

    # Save raw dump text
    raw_file = raw_dump_dir / f"{slug}_raw.txt"
    raw_file.write_text(raw_text, encoding="utf-8")
    print(f"[2/3] Raw dump saved to: {raw_file} ({len(raw_text)} chars)")

    # Parse and transform to OKF & DB
    print("[3/3] Parsing into OKF canonical markdown & relational schema...")
    parsed = parse_myscheme_text_or_markdown(raw_text, fallback_slug=slug)

    db = SessionLocal()
    try:
        scheme = save_parsed_scheme_to_db_and_okf(db, parsed)
        print(f"✓ Ingested '{scheme.name}' (ID: {scheme.id}) into DB & knowledge/schemes/{scheme.slug}.md")
        return {
            "id": scheme.id,
            "slug": scheme.slug,
            "title": scheme.name,
            "ministry": scheme.ministry,
            "category": scheme.category,
            "benefits_count": len(scheme.benefits),
            "rules_count": len(scheme.eligibility_rules),
            "okf_path": f"knowledge/schemes/{scheme.slug}.md",
        }
    finally:
        db.close()


async def scrape_batch_schemes(slugs: list[str]) -> list[dict[str, Any]]:
    """
    Scrapes a batch of schemes sequentially/concurrently.
    """
    results = []
    for s in slugs:
        try:
            res = await scrape_and_ingest_scheme(s)
            results.append(res)
        except Exception as e:
            print(f"[!] Error scraping {s}: {e}")
    return results


if __name__ == "__main__":
    test_slug = sys.argv[1] if len(sys.argv) > 1 else "sgstsc9t10"
    print(f"Running scraper on target: {test_slug}")
    res = asyncio.run(scrape_and_ingest_scheme(test_slug))
    print("\nResult:", res)
