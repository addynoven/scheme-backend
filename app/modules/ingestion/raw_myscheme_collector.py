"""
Raw MyScheme Headless Web Collector (Phase 1: Raw HTML & Text Harvesting).

Navigates MyScheme.gov.in via headless Playwright, extracts scheme URLs,
and dumps the full client-rendered HTML and raw text into `knowledge/raw_dumps/`.
"""

import asyncio
from pathlib import Path
import re
import sys
from typing import Any
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup



RAW_DUMP_DIR = Path("/home/neon/programs/side_project/scheme-backend/knowledge/raw_dumps")


async def collect_scheme_slugs_from_search(max_pages: int = 10) -> list[str]:
    """
    Crawls MyScheme search pagination to discover scheme slugs.
    """
    slugs = set()
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
        )
        page = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
        )
        tab = await page.new_page()

        try:
            print("[*] Navigating to MyScheme search directory to discover scheme slugs...")
            await tab.goto("https://www.myscheme.gov.in/search", wait_until="networkidle", timeout=45000)
            await tab.wait_for_timeout(3000)

            for page_idx in range(1, max_pages + 1):
                content = await tab.content()
                soup = BeautifulSoup(content, "html.parser")

                # Find all links matching /schemes/<slug>
                for a in soup.find_all("a", href=True):
                    href = a["href"]
                    m = re.search(r"/schemes/([a-zA-Z0-9_-]+)", href)
                    if m and m.group(1) not in ("category", "user-journey", "all-states", "all-ministries"):
                        slugs.add(m.group(1))

                print(f"[*] Page {page_idx}: Discovered {len(slugs)} unique scheme slugs so far...")

                # Look for 'Next' button
                next_btn = tab.locator("button[aria-label='Next page'], button:has-text('Next'), li.next a, a[aria-label='Next']").first
                if await next_btn.count() > 0 and await next_btn.is_visible() and await next_btn.is_enabled():
                    await next_btn.click()
                    await tab.wait_for_timeout(2500)
                else:
                    break

        except Exception as e:
            print(f"[!] Error during slug discovery: {e}")
        finally:
            await browser.close()

    return sorted(list(slugs))


async def fetch_and_dump_raw_scheme_page(slug: str) -> dict[str, Any]:
    """
    Visits a single scheme page, waits for React rendering, and saves raw HTML and text.
    """
    RAW_DUMP_DIR.mkdir(parents=True, exist_ok=True)
    url = f"https://www.myscheme.gov.in/schemes/{slug}"

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
        )
        tab = await context.new_page()

        try:
            await tab.goto(url, wait_until="networkidle", timeout=35000)
            await tab.wait_for_timeout(2000)

            # Get full rendered HTML
            rendered_html = await tab.content()

            # Parse clean text with BeautifulSoup
            soup = BeautifulSoup(rendered_html, "html.parser")
            main_el = soup.find("main") or soup.find("div", class_=lambda c: c and "container" in c)
            rendered_text = main_el.get_text(separator="\n", strip=True) if main_el else soup.get_text(separator="\n", strip=True)

            # 1. Save Raw HTML
            html_file = RAW_DUMP_DIR / f"{slug}.html"
            html_file.write_text(rendered_html, encoding="utf-8")

            # 2. Save Raw Text
            txt_file = RAW_DUMP_DIR / f"{slug}_rendered.txt"
            txt_file.write_text(rendered_text, encoding="utf-8")

            return {
                "slug": slug,
                "url": url,
                "html_path": str(html_file),
                "html_size_kb": round(html_file.stat().st_size / 1024, 2),
                "text_path": str(txt_file),
                "text_chars": len(rendered_text),
                "status": "success",
            }
        except Exception as e:
            return {
                "slug": slug,
                "url": url,
                "error": str(e),
                "status": "failed",
            }
        finally:
            await browser.close()


async def run_raw_collector(initial_slugs: list[str] | None = None, discover_count: int = 5):
    """
    Main runner: Discovers slugs (or takes initial list) and fetches raw rendered HTML for each.
    """
    slugs_to_fetch = set(initial_slugs or [])

    # Seed list of known high-priority slugs if not enough
    known_seeds = [
        "sgstsc9t10",
        "pm-kisan",
        "pmjay",
        "ssy",
        "pmuy",
        "pmmy",
        "pm-svanidhi",
        "pm-vishwakarma",
        "mmvy",
        "ladli-behna",
        "majhi-ladki-bahin",
        "yuva-nidhi",
        "gruha-lakshmi",
    ]
    for s in known_seeds:
        slugs_to_fetch.add(s)

    # Discover more from live search
    if discover_count > 0:
        discovered = await collect_scheme_slugs_from_search(max_pages=discover_count)
        slugs_to_fetch.update(discovered)

    slug_list = sorted(list(slugs_to_fetch))
    print(f"\n{'=' * 60}")
    print(f"🚀 STARTING RAW HTML COLLECTION FOR {len(slug_list)} SCHEMES")
    print(f"📁 Destination Folder: {RAW_DUMP_DIR}")
    print(f"{'=' * 60}\n")

    successful = 0
    failed = 0

    for idx, slug in enumerate(slug_list, start=1):
        print(f"[{idx}/{len(slug_list)}] Fetching rendered HTML for '{slug}'...")
        res = await fetch_and_dump_raw_scheme_page(slug)
        if res["status"] == "success":
            successful += 1
            print(f"  ✓ Saved HTML: {res['html_size_kb']} KB | Text: {res['text_chars']} chars")
        else:
            failed += 1
            print(f"  ✗ Failed: {res.get('error')}")

    print(f"\n{'=' * 60}")
    print("✅ RAW HTML DUMPING COMPLETE")
    print(f"  • Successful: {successful}")
    print(f"  • Failed:     {failed}")
    print(f"  • Files saved in: {RAW_DUMP_DIR}")
    print(f"{'=' * 60}\n")


if __name__ == "__main__":
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    asyncio.run(run_raw_collector(discover_count=count))
