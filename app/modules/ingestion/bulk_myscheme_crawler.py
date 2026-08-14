"""
High-Throughput Concurrent MyScheme Bulk Harvester (All 4,770+ Schemes).

1. Slug Discovery:
   - Traverses MyScheme paginated search index (pages 1 to 480)
   - Persists discovered slugs to `knowledge/raw_dumps/discovered_slugs.json`
2. High-Speed Concurrent Worker Pool:
   - 6 parallel headless Playwright workers
   - Checkpoint-based: Skips already downloaded HTML files
3. Output:
   - `knowledge/raw_dumps/<slug>.html`
   - `knowledge/raw_dumps/<slug>_rendered.txt`
"""

import asyncio
import json
from pathlib import Path
import re
import sys
import time
from typing import Any

from playwright.async_api import async_playwright
from bs4 import BeautifulSoup


RAW_DUMP_DIR = Path("/home/neon/programs/side_project/scheme-backend/knowledge/raw_dumps")
SLUG_INDEX_FILE = RAW_DUMP_DIR / "discovered_slugs.json"
CONCURRENCY = 6


def load_known_slugs() -> set[str]:
    if SLUG_INDEX_FILE.exists():
        try:
            return set(json.loads(SLUG_INDEX_FILE.read_text(encoding="utf-8")))
        except Exception:
            return set()
    return set()


def save_known_slugs(slugs: set[str]):
    RAW_DUMP_DIR.mkdir(parents=True, exist_ok=True)
    SLUG_INDEX_FILE.write_text(json.dumps(sorted(list(slugs)), indent=2), encoding="utf-8")


async def run_discovery_phase(browser, max_pages: int = 480) -> set[str]:
    print("\n" + "=" * 60)
    print(f"🔍 PHASE 1: DISCOVERING ALL SCHEME SLUGS ACROSS {max_pages} SEARCH PAGES...")
    print("=" * 60)
    
    slugs = load_known_slugs()
    print(f"[*] Starting with {len(slugs)} cached slugs from {SLUG_INDEX_FILE}")

    context = await browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        viewport={"width": 1280, "height": 800},
    )
    page = await context.new_page()

    try:
        await page.goto("https://www.myscheme.gov.in/search", wait_until="networkidle", timeout=40000)
        await page.wait_for_timeout(3000)

        for p_idx in range(1, max_pages + 1):
            content = await page.content()
            soup = BeautifulSoup(content, "html.parser")

            page_slugs = []
            for a in soup.find_all("a", href=True):
                href = a["href"]
                m = re.search(r"/schemes/([a-zA-Z0-9_-]+)", href)
                if m:
                    slug_candidate = m.group(1)
                    if slug_candidate not in ("category", "user-journey", "all-states", "all-ministries", "search"):
                        page_slugs.append(slug_candidate)
                        slugs.add(slug_candidate)

            if p_idx % 5 == 0 or p_idx == 1:
                print(f"  • Search Page {p_idx:3d}/{max_pages}: Found {len(page_slugs)} on page -> Total unique: {len(slugs)}")
                save_known_slugs(slugs)

            # Advance to next page
            next_target = page.locator(f"li:has-text('{p_idx + 1}')").first
            if await next_target.count() > 0:
                await next_target.click()
            else:
                next_arrow = page.locator("svg.cursor-pointer").last
                if await next_arrow.count() > 0 and await next_arrow.is_visible():
                    await next_arrow.click()
                else:
                    print(f"[*] End of pagination reached at page {p_idx}.")
                    break

            await page.wait_for_timeout(1800)

    except Exception as e:
        print(f"[!] Pagination note: {e}")
    finally:
        await context.close()

    save_known_slugs(slugs)
    print(f"\n✅ DISCOVERY COMPLETE: {len(slugs)} total unique scheme slugs recorded.\n")
    return slugs


async def worker_fetch_scheme(worker_id: int, queue: asyncio.Queue, browser, stats: dict[str, int]):
    context = await browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        viewport={"width": 1280, "height": 800},
    )
    page = await context.new_page()

    try:
        while not queue.empty():
            slug = await queue.get()
            html_file = RAW_DUMP_DIR / f"{slug}.html"
            txt_file = RAW_DUMP_DIR / f"{slug}_rendered.txt"

            # Checkpoint: Skip if already fetched and valid
            if html_file.exists() and html_file.stat().st_size > 10000 and txt_file.exists() and txt_file.stat().st_size > 500:
                stats["skipped"] += 1
                queue.task_done()
                continue

            url = f"https://www.myscheme.gov.in/schemes/{slug}"
            try:
                await page.goto(url, wait_until="networkidle", timeout=30000)
                await page.wait_for_timeout(1500)

                rendered_html = await page.content()
                soup = BeautifulSoup(rendered_html, "html.parser")
                main_el = soup.find("main") or soup.find("div", class_=lambda c: c and "container" in c)
                rendered_text = main_el.get_text(separator="\n", strip=True) if main_el else soup.get_text(separator="\n", strip=True)

                # Save raw dumps
                html_file.write_text(rendered_html, encoding="utf-8")
                txt_file.write_text(rendered_text, encoding="utf-8")

                stats["downloaded"] += 1
                total_done = stats["downloaded"] + stats["skipped"]
                if total_done % 10 == 0 or stats["downloaded"] <= 10:
                    print(f"[{total_done}/{stats['total']}] (Worker {worker_id}) Saved '{slug}' ({round(html_file.stat().st_size / 1024, 1)} KB, {len(rendered_text)} chars)")

            except Exception as e:
                stats["failed"] += 1
                print(f"[Worker {worker_id}] ✗ Failed '{slug}': {e}")

            queue.task_done()
    finally:
        await context.close()


async def run_bulk_harvester(max_pages: int = 480, max_schemes: int | None = None):
    start_time = time.time()
    RAW_DUMP_DIR.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
        )

        # 1. Discover all slugs
        all_slugs = await run_discovery_phase(browser, max_pages=max_pages)
        slug_list = sorted(list(all_slugs))
        if max_schemes:
            slug_list = slug_list[:max_schemes]

        print("=" * 60)
        print(f"🚀 PHASE 2: HARVESTING RAW HTML & TEXT FOR {len(slug_list)} SCHEMES")
        print(f"⚡ Concurrency: {CONCURRENCY} Parallel Headless Workers")
        print(f"📁 Target Directory: {RAW_DUMP_DIR}")
        print("=" * 60 + "\n")

        # 2. Fill Queue
        queue = asyncio.Queue()
        for slug in slug_list:
            queue.put_nowait(slug)

        stats = {
            "total": len(slug_list),
            "downloaded": 0,
            "skipped": 0,
            "failed": 0,
        }

        # 3. Spawn Worker Pool
        workers = [
            asyncio.create_task(worker_fetch_scheme(i, queue, browser, stats))
            for i in range(1, CONCURRENCY + 1)
        ]

        await queue.join()
        for w in workers:
            w.cancel()

        await browser.close()

    elapsed = round(time.time() - start_time, 1)
    print(f"\n{'=' * 60}")
    print("🎉 BULK HARVESTING SUMMARY")
    print(f"{'=' * 60}")
    print(f"  • Total Schemes Processed: {stats['total']}")
    print(f"  • Newly Downloaded:       {stats['downloaded']}")
    print(f"  • Already Cached (Skip):   {stats['skipped']}")
    print(f"  • Failed / Timed Out:      {stats['failed']}")
    print(f"  • Elapsed Time:            {elapsed}s")
    print(f"  • Raw Files in:            {RAW_DUMP_DIR}")
    print(f"{'=' * 60}\n")


if __name__ == "__main__":
    pages = int(sys.argv[1]) if len(sys.argv) > 1 else 480
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else None
    asyncio.run(run_bulk_harvester(max_pages=pages, max_schemes=limit))
