"""
Official 4,770+ MyScheme Master Slug Indexer (Polite Jitter + Real Chrome).

Traverses all 480 pages of the official search catalog with an 8–12 second randomized delay,
collecting all 4,770+ official scheme slugs into `knowledge/raw_dumps/all_4770_official_slugs.json`.
"""

import asyncio
import json
from pathlib import Path
import random
import sys
import time
from typing import Any

from playwright.async_api import async_playwright
from bs4 import BeautifulSoup


RAW_DUMP_DIR = Path("/home/neon/programs/side_project/scheme-backend/knowledge/raw_dumps")
USER_DATA_DIR = Path("/home/neon/.chrome_crawler_profile")
OUTPUT_SLUGS_FILE = RAW_DUMP_DIR / "all_4770_official_slugs.json"
STATE_FILE = RAW_DUMP_DIR / "indexer_state.json"


def load_known_slugs() -> set[str]:
    if OUTPUT_SLUGS_FILE.exists():
        try:
            return set(json.loads(OUTPUT_SLUGS_FILE.read_text(encoding="utf-8")))
        except Exception:
            return set()
    return set()


def save_slugs(slugs: set[str], page_num: int):
    RAW_DUMP_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_SLUGS_FILE.write_text(json.dumps(sorted(list(slugs)), indent=2), encoding="utf-8")
    STATE_FILE.write_text(json.dumps({"last_completed_page": page_num, "total_slugs": len(slugs), "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")}, indent=2), encoding="utf-8")


async def run_master_slug_indexer(max_pages: int = 480, min_delay: float = 8.0, max_delay: float = 12.0):
    RAW_DUMP_DIR.mkdir(parents=True, exist_ok=True)
    USER_DATA_DIR.mkdir(parents=True, exist_ok=True)

    all_slugs = load_known_slugs()
    print("=" * 65)
    print("🏛️  STARTING OFFICIAL 4,770+ MYSCHEME SLUG INDEXER")
    print(f"⏱️  Polite Rate Limit: {min_delay}s – {max_delay}s randomized delay per page")
    print(f"📂 Output File: {OUTPUT_SLUGS_FILE}")
    print(f"[*] Starting with {len(all_slugs)} cached slugs.")
    print("=" * 65 + "\n")

    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            user_data_dir=str(USER_DATA_DIR),
            executable_path="/home/neon/.local/bin/google-chrome",
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
            ],
            viewport={"width": 1366, "height": 768},
        )
        page = context.pages[0] if context.pages else await context.new_page()

        print("[*] Navigating to MyScheme search directory...")
        await page.goto("https://www.myscheme.gov.in/search", wait_until="networkidle", timeout=45000)
        await page.wait_for_timeout(3000)

        for p_idx in range(1, max_pages + 1):
            content = await page.content()
            soup = BeautifulSoup(content, "html.parser")
            page_slugs = [
                a["href"].split("/")[-1].split("?")[0]
                for a in soup.find_all("a", href=True)
                if a["href"].startswith("/schemes/")
            ]

            all_slugs.update(page_slugs)
            print(f"[Page {p_idx:3d}/{max_pages}] Discovered {len(page_slugs)} schemes on page | Total unique so far: {len(all_slugs)}")

            # Save state
            save_slugs(all_slugs, p_idx)

            # Advance to next page
            next_num = p_idx + 1
            num_btn = page.locator(f"li:has-text('{next_num}')").first
            if await num_btn.count() > 0 and await num_btn.is_visible():
                await num_btn.click()
            else:
                next_arrow = page.locator("svg.cursor-pointer").last
                if await next_arrow.count() > 0 and await next_arrow.is_visible():
                    await next_arrow.click()
                else:
                    print(f"[*] Reached end of catalog at page {p_idx}.")
                    break

            # Polite 8-12s randomized delay
            delay = round(random.uniform(min_delay, max_delay), 1)
            await page.mouse.move(random.randint(100, 500), random.randint(100, 400))
            await asyncio.sleep(delay)

        await context.close()

    print("\n" + "=" * 65)
    print(f"✅ INDEXING COMPLETE: {len(all_slugs)} TOTAL OFFICIAL SCHEME SLUGS")
    print(f"📁 Saved in: {OUTPUT_SLUGS_FILE}")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    pages = int(sys.argv[1]) if len(sys.argv) > 1 else 480
    asyncio.run(run_master_slug_indexer(max_pages=pages, min_delay=8.0, max_delay=12.0))
