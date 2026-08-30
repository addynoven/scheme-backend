"""
Validated Stealth MyScheme Harvester (Persistent Real Chrome + In-Flight Content Validator).

Key Mechanisms:
1. Real Persistent Google Chrome Engine:
   - Uses `launch_persistent_context` with local Google Chrome.
   - Eliminates automation flags and preserves cookies.
2. In-Flight Content Validator:
   - Validates HTML size >= 120 KB and text >= 3,000 chars before saving.
   - Checks for core sections (Details, Benefits, Eligibility, Documents, Application).
   - Rejects empty shells or 404 error popups.
3. Polite 8–12s Randomized Delay:
   - Sleeps for a random 8–12s jitter between pages to respect government servers.
   - Simulates human mouse movement and smooth scrolling.
4. Storage & Checkpointing:
   - Saves `knowledge/raw_dumps/<slug>.html` and `knowledge/raw_dumps/<slug>_rendered.txt`.
   - Checkpoint saved to `knowledge/raw_dumps/crawler_checkpoint.json`.
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
SLUGS_INDEX_FILE = RAW_DUMP_DIR / "all_4770_official_slugs.json"
CHECKPOINT_FILE = RAW_DUMP_DIR / "crawler_checkpoint.json"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
]


def load_target_slugs() -> list[str]:
    slugs = set()
    if SLUGS_INDEX_FILE.exists():
        try:
            slugs.update(json.loads(SLUGS_INDEX_FILE.read_text(encoding="utf-8")))
        except Exception:
            pass

    # High-priority national seeds
    known_seeds = [
        "sgstsc9t10", "pm-kisan", "pmjay", "ssy", "pmuy", "pmmy", "pm-svanidhi",
        "pm-vishwakarma", "mmvy", "ladli-behna", "majhi-ladki-bahin", "yuva-nidhi",
        "gruha-lakshmi", "rgisfm", "sfava", "post-st", "famdpwog", "ip-mea", "syss",
        "oasas", "sui", "pmsby", "us", "amcsy", "scossi", "sss", "kbpyy", "mmuy",
        "rcmrf-mh", "wbkanyashree", "hiip", "ma-maha", "mmkssy-assam", "ignoaps-sikkim"
    ]
    slugs.update(known_seeds)
    return sorted(list(slugs))


def validate_scraped_scheme_payload(content_html: str, text: str) -> tuple[bool, str]:
    """
    In-flight content validator:
    Ensures the downloaded page is a genuine, rich scheme and not an empty template shell.
    """
    if len(content_html) < 120_000:
        return False, f"HTML size too small ({round(len(content_html)/1024, 1)} KB < 120 KB)"

    if len(text) < 3_000:
        return False, f"Text payload too short ({len(text)} chars < 3000 chars)"

    text_lower = text.lower()
    sections = [
        "benefit" in text_lower,
        "eligib" in text_lower,
        "detail" in text_lower or "introduced by" in text_lower or "launched by" in text_lower,
        "document" in text_lower,
        "application" in text_lower,
        "source" in text_lower or "guideline" in text_lower or "faq" in text_lower,
    ]
    if sum(sections) < 3:
        return False, f"Missing core scheme sections ({sum(sections)}/6 found)"

    return True, "VALID_RICH_SCHEME"


def save_checkpoint(stats: dict[str, Any]):
    RAW_DUMP_DIR.mkdir(parents=True, exist_ok=True)
    CHECKPOINT_FILE.write_text(json.dumps(stats, indent=2), encoding="utf-8")


async def run_validated_harvester(
    min_delay: float = 8.0,
    max_delay: float = 12.0,
    max_count: int | None = None,
):
    RAW_DUMP_DIR.mkdir(parents=True, exist_ok=True)
    USER_DATA_DIR.mkdir(parents=True, exist_ok=True)

    all_slugs = load_target_slugs()
    # Randomize queue order
    random.seed(int(time.time()))
    random.shuffle(all_slugs)

    if max_count:
        all_slugs = all_slugs[:max_count]

    total_schemes = len(all_slugs)
    print("=" * 70)
    print(f"🚀 LAUNCHING VALIDATED MYSCHEME HARVESTER ({total_schemes} SCHEMES IN QUEUE)")
    print("⚙️  Engine: Real Persistent Google Chrome Profile")
    print(f"⏱️  Polite Rate Limit: Random delay of {min_delay}s – {max_delay}s per page")
    print("🛡️  In-Flight Validator: Real-time HTML size & section verification enabled")
    print(f"📁 Destination Folder: {RAW_DUMP_DIR}")
    print("=" * 70 + "\n")

    stats = {
        "total_in_queue": total_schemes,
        "completed": 0,
        "valid_rich_downloads": 0,
        "skipped_valid_cache": 0,
        "rejected_invalid_shells": 0,
        "failed_network": 0,
        "last_updated": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

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
            user_agent=random.choice(USER_AGENTS),
        )

        page = context.pages[0] if context.pages else await context.new_page()

        for idx, slug in enumerate(all_slugs, start=1):
            html_file = RAW_DUMP_DIR / f"{slug}.html"
            txt_file = RAW_DUMP_DIR / f"{slug}_rendered.txt"

            # Checkpoint: Skip if already fetched and verified (>120 KB and >3000 chars)
            if html_file.exists() and html_file.stat().st_size >= 120000 and txt_file.exists() and txt_file.stat().st_size >= 3000:
                stats["skipped_valid_cache"] += 1
                stats["completed"] += 1
                if idx % 10 == 0 or idx <= 3:
                    print(f"[{idx}/{total_schemes}] ⚡ Skipped verified dump: '{slug}' ({round(html_file.stat().st_size / 1024, 1)} KB, {txt_file.stat().st_size} chars)")
                continue

            url = f"https://www.myscheme.gov.in/schemes/{slug}"
            delay = round(random.uniform(min_delay, max_delay), 1)

            try:
                print(f"[{idx}/{total_schemes}] Visiting '{slug}' (Polite delay: {delay}s)...")
                await page.goto(url, wait_until="networkidle", timeout=35000)
                await page.wait_for_timeout(2500)

                # Simulate human interaction
                await page.mouse.move(random.randint(100, 600), random.randint(100, 400))
                await page.mouse.wheel(0, 350)
                await page.wait_for_timeout(1000)

                rendered_html = await page.content()
                soup = BeautifulSoup(rendered_html, "html.parser")
                main_el = soup.find("main") or soup.find("div", class_=lambda c: c and "container" in c)
                rendered_text = main_el.get_text(separator="\n", strip=True) if main_el else soup.get_text(separator="\n", strip=True)

                # IN-FLIGHT VALIDATION
                is_valid, reason = validate_scraped_scheme_payload(rendered_html, rendered_text)

                if is_valid:
                    # Save valid files
                    html_file.write_text(rendered_html, encoding="utf-8")
                    txt_file.write_text(rendered_text, encoding="utf-8")
                    stats["valid_rich_downloads"] += 1
                    print(f"  ✅ [VALID] Saved '{slug}' -> {round(html_file.stat().st_size / 1024, 1)} KB HTML | {len(rendered_text)} chars text")
                else:
                    stats["rejected_invalid_shells"] += 1
                    # Clean up any partial files
                    html_file.unlink(missing_ok=True)
                    txt_f_path = RAW_DUMP_DIR / f"{slug}_rendered.txt"
                    txt_f_path.unlink(missing_ok=True)
                    print(f"  ❌ [REJECTED] '{slug}' is invalid: {reason} (Discarded)")

                stats["completed"] += 1

            except Exception as e:
                stats["failed_network"] += 1
                stats["completed"] += 1
                print(f"  ⚠️  [NETWORK ERROR] '{slug}': {e}")

            # Polite randomized sleep
            await asyncio.sleep(delay)

            if idx % 5 == 0:
                stats["last_updated"] = time.strftime("%Y-%m-%d %H:%M:%S")
                save_checkpoint(stats)

        await context.close()

    stats["last_updated"] = time.strftime("%Y-%m-%d %H:%M:%S")
    save_checkpoint(stats)

    print("\n" + "=" * 70)
    print("🎉 HARVESTING RUN FINISHED")
    print("=" * 70)
    print(f"  • Total in Queue:           {stats['total_in_queue']}")
    print(f"  • Valid Rich Downloads:     {stats['valid_rich_downloads']}")
    print(f"  • Skipped (Verified Cache): {stats['skipped_valid_cache']}")
    print(f"  • Rejected Invalid Shells:  {stats['rejected_invalid_shells']}")
    print(f"  • Network / Timeout Errors: {stats['failed_network']}")
    print(f"  • Checkpoint File:          {CHECKPOINT_FILE}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    count_arg = int(sys.argv[1]) if len(sys.argv) > 1 else None
    asyncio.run(run_validated_harvester(min_delay=8.0, max_delay=12.0, max_count=count_arg))
