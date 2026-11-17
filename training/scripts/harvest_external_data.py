#!/usr/bin/env python3
"""
MentorMaze-2B External Data Harvester & Knowledge Extractor
Utilizes verified API keys for Kaggle, Stack Exchange, Firecrawl, Apify, Groq, and OpenRouter.
Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
"""

import os
import sys
import json
import time
import argparse
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"
HARVEST_DIR = BASE_DIR / "training" / "datasets" / "harvested"
HARVEST_DIR.mkdir(parents=True, exist_ok=True)

def load_env():
    """Load key-value pairs from .env if present"""
    if ENV_FILE.exists():
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k not in os.environ:
                    os.environ[k] = v

load_env()

def verify_all_keys():
    """Verify live connectivity across all user-provided API credentials"""
    print("=" * 60)
    print("MENTORMAZE API CREDENTIAL VERIFICATION SUITE")
    print("=" * 60)

    results = {}

    # 1. Google Gemini
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
            req = urllib.request.Request(
                url,
                data=json.dumps({"contents": [{"parts": [{"text": "ping"}]}]}).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())
                results["gemini"] = {"status": "LIVE", "model": "gemini-2.5-flash"}
        except Exception as e:
            results["gemini"] = {"status": "ERROR", "error": str(e)}
    else:
        results["gemini"] = {"status": "UNCONFIGURED"}

    # 2. Groq
    groq_keys = [
        os.environ.get("GROQ_API_KEY"),
        os.environ.get("GROQ_API_KEY_2"),
        os.environ.get("GROQ_API_KEY_3"),
        os.environ.get("GROQ_API_KEY_4"),
        os.environ.get("GROQ_API_KEY_5"),
    ]
    groq_keys = [k for k in groq_keys if k]
    if groq_keys:
        groq_success = False
        last_err = ""
        for k in groq_keys:
            try:
                req = urllib.request.Request(
                    "https://api.groq.com/openai/v1/chat/completions",
                    data=json.dumps({
                        "model": "qwen/qwen3.8-27b",
                        "messages": [{"role": "user", "content": "ping"}]
                    }).encode("utf-8"),
                    headers={
                        "Authorization": f"Bearer {k}",
                        "Content-Type": "application/json",
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
                    }
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = json.loads(resp.read().decode())
                    results["groq"] = {"status": "LIVE", "model": "qwen/qwen3.8-27b", "active_key": f"{k[:8]}..."}
                    groq_success = True
                    break
            except Exception as e:
                last_err = str(e)
        if not groq_success:
            results["groq"] = {"status": "ERROR", "error": last_err}
    else:
        results["groq"] = {"status": "UNCONFIGURED"}

    # 3. OpenRouter
    openrouter_key = os.environ.get("OPENROUTER_API_KEY")
    if openrouter_key:
        try:
            req = urllib.request.Request(
                "https://openrouter.ai/api/v1/chat/completions",
                data=json.dumps({
                    "model": "meta-llama/llama-3.3-70b-instruct",
                    "messages": [{"role": "user", "content": "ping"}]
                }).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {openrouter_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://mentormaze.aitathastu.com"
                }
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())
                results["openrouter"] = {"status": "LIVE", "model": "llama-3.3-70b-instruct"}
        except Exception as e:
            results["openrouter"] = {"status": "ERROR", "error": str(e)}
    else:
        results["openrouter"] = {"status": "UNCONFIGURED"}

    # 4. Firecrawl
    firecrawl_key = os.environ.get("FIRECRAWL_API_KEY")
    if firecrawl_key:
        try:
            req = urllib.request.Request(
                "https://api.firecrawl.dev/v1/scrape",
                data=json.dumps({"url": "https://example.com"}).encode("utf-8"),
                headers={"Authorization": f"Bearer {firecrawl_key}", "Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())
                if data.get("success"):
                    results["firecrawl"] = {"status": "LIVE", "credits_used": data.get("data", {}).get("metadata", {}).get("creditsUsed", 1)}
                else:
                    results["firecrawl"] = {"status": "ERROR", "error": data.get("error")}
        except Exception as e:
            results["firecrawl"] = {"status": "ERROR", "error": str(e)}
    else:
        results["firecrawl"] = {"status": "UNCONFIGURED"}

    # 5. Apify
    apify_token = os.environ.get("APIFY_API_TOKEN")
    if apify_token:
        try:
            url = f"https://api.apify.com/v2/users/me?token={apify_token}"
            with urllib.request.urlopen(url, timeout=10) as resp:
                data = json.loads(resp.read().decode())
                results["apify"] = {
                    "status": "LIVE",
                    "username": data.get("data", {}).get("username"),
                    "plan": data.get("data", {}).get("plan", {}).get("tier")
                }
        except Exception as e:
            results["apify"] = {"status": "ERROR", "error": str(e)}
    else:
        results["apify"] = {"status": "UNCONFIGURED"}

    # 6. Kaggle
    kaggle_user = os.environ.get("KAGGLE_USERNAME")
    kaggle_key = os.environ.get("KAGGLE_KEY")
    if kaggle_user and kaggle_key:
        try:
            import base64
            auth_str = base64.b64encode(f"{kaggle_user}:{kaggle_key}".encode()).decode()
            url = "https://www.kaggle.com/api/v1/datasets/list?search=naukri"
            req = urllib.request.Request(url, headers={"Authorization": f"Basic {auth_str}"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())
                results["kaggle"] = {"status": "LIVE", "username": kaggle_user, "datasets_found": len(data)}
        except Exception as e:
            results["kaggle"] = {"status": "ERROR", "error": str(e)}
    else:
        results["kaggle"] = {"status": "UNCONFIGURED"}

    # 7. Stack Exchange
    se_key = os.environ.get("STACKEXCHANGE_API_KEY")
    if se_key:
        try:
            import gzip
            url = f"https://api.stackexchange.com/2.3/info?site=stackoverflow&key={se_key}"
            req = urllib.request.Request(url, headers={"Accept-Encoding": "gzip"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                raw_bytes = resp.read()
                try:
                    decompressed = gzip.decompress(raw_bytes)
                    data = json.loads(decompressed.decode())
                except:
                    data = json.loads(raw_bytes.decode())
                results["stackexchange"] = {
                    "status": "LIVE",
                    "quota_max": data.get("quota_max"),
                    "quota_remaining": data.get("quota_remaining")
                }
        except Exception as e:
            results["stackexchange"] = {"status": "ERROR", "error": str(e)}
    else:
        results["stackexchange"] = {"status": "UNCONFIGURED"}

    for name, info in results.items():
        status_icon = "✓ [LIVE]" if info.get("status") == "LIVE" else "✗ [" + info.get("status") + "]"
        details = ", ".join(f"{k}={v}" for k, v in info.items() if k != "status")
        print(f"{name.upper():<15} {status_icon:<10} {details}")

    print("=" * 60)
    return results

def harvest_stack_overflow(tags=["two-pointers", "dynamic-programming", "distributed-system"], max_items=25):
    """Query Stack Overflow for high-vote algorithmic and CS questions/answers"""
    print(f"\n[StackOverflow] Harvesting top Q&A pairs for tags: {tags}...")
    se_key = os.environ.get("STACKEXCHANGE_API_KEY", "")
    items_collected = []

    for tag in tags:
        try:
            url = f"https://api.stackexchange.com/2.3/questions?order=desc&sort=votes&tagged={tag}&site=stackoverflow&filter=withbody&pagesize=10"
            if se_key:
                url += f"&key={se_key}"

            req = urllib.request.Request(url, headers={"Accept-Encoding": "gzip"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                import gzip
                raw = resp.read()
                try:
                    data = json.loads(gzip.decompress(raw).decode())
                except:
                    data = json.loads(raw.decode())

                for q in data.get("items", []):
                    title = q.get("title")
                    link = q.get("link")
                    score = q.get("score")
                    q_id = q.get("question_id")
                    items_collected.append({
                        "id": f"so-{q_id}",
                        "source": "Stack Overflow",
                        "tag": tag,
                        "title": title,
                        "url": link,
                        "score": score,
                        "body_preview": q.get("body", "")[:300] + "..."
                    })
            time.sleep(0.5)
        except Exception as e:
            print(f"Error fetching tag {tag}: {e}")

    out_file = HARVEST_DIR / "stackoverflow_curated_qa.jsonl"
    with open(out_file, "w", encoding="utf-8") as f:
        for item in items_collected:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    print(f"[StackOverflow] Saved {len(items_collected)} high-vote technical records to {out_file.name}")
    return items_collected

def harvest_kaggle_datasets_catalog():
    """List and catalog available tech job & coding datasets on Kaggle"""
    print("\n[Kaggle] Cataloging datasets using Kaggle API...")
    kaggle_user = os.environ.get("KAGGLE_USERNAME")
    kaggle_key = os.environ.get("KAGGLE_KEY")
    if not (kaggle_user and kaggle_key):
        print("[Kaggle] Credentials missing; skipping.")
        return []

    import base64
    auth_str = base64.b64encode(f"{kaggle_user}:{kaggle_key}".encode()).decode()
    queries = ["tech job postings", "leetcode problems", "software engineer salary india"]
    cataloged = []

    for q in queries:
        try:
            url = f"https://www.kaggle.com/api/v1/datasets/list?search={urllib.parse.quote(q)}&sortBy=votes"
            req = urllib.request.Request(url, headers={"Authorization": f"Basic {auth_str}"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())
                for d in data[:5]:
                    cataloged.append({
                        "ref": d.get("ref"),
                        "title": d.get("title"),
                        "creator": d.get("creatorName"),
                        "vote_count": d.get("voteCount"),
                        "download_count": d.get("downloadCount"),
                        "search_query": q,
                        "url": f"https://www.kaggle.com/datasets/{d.get('ref')}"
                    })
            time.sleep(0.5)
        except Exception as e:
            print(f"[Kaggle] Query '{q}' failed: {e}")

    out_file = HARVEST_DIR / "kaggle_tech_datasets_catalog.jsonl"
    with open(out_file, "w", encoding="utf-8") as f:
        for item in cataloged:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    print(f"[Kaggle] Cataloged {len(cataloged)} top community datasets to {out_file.name}")
    return cataloged

def main():
    parser = argparse.ArgumentParser(description="MentorMaze Multi-Source External Data Harvester")
    parser.add_argument("--verify", action="store_true", help="Verify all API credentials live")
    parser.add_argument("--harvest", action="store_true", help="Execute external data harvesting routines")
    args = parser.parse_args()

    if args.verify or len(sys.argv) == 1:
        verify_all_keys()

    if args.harvest or len(sys.argv) == 1:
        harvest_stack_overflow()
        harvest_kaggle_datasets_catalog()

if __name__ == "__main__":
    main()
