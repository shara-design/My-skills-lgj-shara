"""Local port of the Mailmeteor spam checker (https://mailmeteor.com/spam-checker).

Reverse engineered from https://mailmeteor.com/assets/js/spam-checker.js (v=20260510).
769 regex keywords across 5 categories: shady (399), overpromise (103),
money (101), urgency (91), unnatural (75).

Scoring (exact port):
    score = total keyword hits
          + 20 if any money or shady hit
          + 10 if any urgency or overpromise hit
    score > 20 -> Poor | score > 5 -> Okay | else -> Great

Usage:
    python spam_check.py --file copy.txt
    python spam_check.py --text "Act now to claim your free bonus"
    echo "some copy" | python spam_check.py
    python spam_check.py --file copy.txt --json
"""

import argparse
import json
import re
import sys
from pathlib import Path

WORDLIST_PATH = Path(__file__).parent / "mailmeteor_spam_words.json"

CATEGORY_LABELS = {
    "overpromise": "Overpromise",
    "urgency": "Urgency",
    "money": "Money",
    "shady": "Shady",
    "unnatural": "Unnatural",
}


def load_wordlist():
    entries = json.loads(WORDLIST_PATH.read_text(encoding="utf-8"))
    for e in entries:
        e["_re"] = re.compile(e["pattern"], re.IGNORECASE)
    return entries


def get_ranges(text, entries):
    """Collect (start, end, entry) for every match, in wordlist order (matches JS)."""
    ranges = []
    for e in entries:
        for m in e["_re"].finditer(text):
            ranges.append((m.start(), m.end(), e))
    return ranges


def remove_staggered(ranges):
    """Exact port of removeStaggeredRanges: drop staggered overlaps, keep clean nesting."""
    kept = []
    for r in ranges:
        staggered = any(
            ((r[0] > u[0] and r[0] < u[1]) != (r[1] > u[0] and r[1] < u[1]))
            for u in kept
        )
        if not staggered:
            kept.append(r)
    return kept


def check(text, entries):
    ranges = remove_staggered(get_ranges(text, entries))

    hits = []
    categories = {}
    for start, end, e in ranges:
        hits.append({
            "word": text[start:end],
            "keyword": e["keyword"],
            "category": e["category"],
            "start": start,
            "end": end,
        })
        categories.setdefault(e["category"], []).append(e["keyword"])

    score = len(hits)
    if "money" in categories or "shady" in categories:
        score += 20
    if "urgency" in categories or "overpromise" in categories:
        score += 10

    rating = "Poor" if score > 20 else ("Okay" if score > 5 else "Great")
    total_words = len(re.split(r"\s+", text)) - 1

    return {
        "rating": rating,
        "score": score,
        "total_hits": len(hits),
        "words": total_words,
        "categories": {k: sorted(set(v)) for k, v in categories.items()},
        "category_counts": {k: len(v) for k, v in categories.items()},
        "hits": sorted(hits, key=lambda h: h["start"]),
    }


def annotate(text, hits):
    """Insert [category] markers after each flagged word (outermost-first for nesting)."""
    out = text
    for h in sorted(hits, key=lambda h: (-h["start"], h["end"])):
        out = out[:h["end"]] + "[" + h["category"].upper() + "]" + out[h["end"]:]
    return out


def main():
    ap = argparse.ArgumentParser(description="Mailmeteor spam checker, local port")
    ap.add_argument("--file", help="read copy from a file")
    ap.add_argument("--text", help="copy passed inline")
    ap.add_argument("--json", action="store_true", help="machine-readable output")
    args = ap.parse_args()

    if args.file:
        text = Path(args.file).read_text(encoding="utf-8")
    elif args.text:
        text = args.text
    else:
        text = sys.stdin.read()

    result = check(text, load_wordlist())

    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    if args.json:
        result["annotated"] = annotate(text, result["hits"])
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return

    print(f"Overall score : {result['rating']} (numeric {result['score']})")
    print(f"Words         : {result['words']}")
    print(f"Spam hits     : {result['total_hits']}")
    print()
    for cat in ("urgency", "overpromise", "money", "shady", "unnatural"):
        if cat in result["categories"]:
            kws = result["categories"][cat]
            print(f"  {CATEGORY_LABELS[cat]} ({result['category_counts'][cat]}): {', '.join(kws)}")
    if result["hits"]:
        print()
        print("--- annotated copy ---")
        print(annotate(text, result["hits"]))


if __name__ == "__main__":
    main()
