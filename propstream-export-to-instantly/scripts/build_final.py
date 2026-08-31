#!/usr/bin/env python3
"""
Stage 3: MillionVerifier full report + owner map -> Instantly upload + batch 2.

Usage:
    python3 build_final.py <FULL_REPORT.csv> <MAP.csv> <output_dir> <list_name>

Writes:
    <list_name> - INSTANTLY UPLOAD.csv        <- the deliverable
    <list_name> - BATCH 2 (risky, hold).csv   <- catch-all / unknown, send later
"""
import csv, os, re, sys
from collections import defaultdict, Counter

# trust-vehicle / entity fragments PropStream leaves in the name fields
ENTITY = {
    "fml", "fmly", "lvg", "lvng", "prpty", "prop", "revocabl", "revocable",
    "survivors", "survivor", "trst", "generation-skipping", "intv", "intervivos",
    "appartments", "apartments", "supportive", "citywide", "dwelling", "parnters",
    "partners", "mngtcorp", "mgmt", "custos", "theatrical", "nought", "overcoming",
    "spectrum", "available", "name", "not", "unknown", "none",
}
NAME_RE = re.compile(r"[A-Za-z][A-Za-z'\-. ]*$")


def score(r):
    """Lower is better. Prefer addresses that contain the owner's own name."""
    local = r["email"].split("@")[0].lower()
    ln = (r.get("lastName") or "").lower()
    fn = (r.get("firstName") or "").lower()
    s = 0
    if len(ln) >= 4 and ln in local:
        s += 3
    if len(fn) >= 4 and fn in local:
        s += 2
    if (r.get("role") or "").lower() == "yes":
        s -= 5
    return (-s, int(r.get("slot") or 99))


def main():
    if len(sys.argv) != 5:
        sys.exit(__doc__)
    rep, mp, outdir, name = sys.argv[1:5]
    os.makedirs(outdir, exist_ok=True)

    rows = list(csv.DictReader(open(rep, encoding="utf-8-sig")))
    people = {r["owner_id"]: r for r in csv.DictReader(open(mp, encoding="utf-8-sig"))}

    if "quality" not in (rows[0] if rows else {}):
        sys.exit("no 'quality' column — did you download the FULL report, not 'Good only'?")

    print(f"verified addresses : {len(rows)}")
    print(f"quality            : {dict(Counter(r['quality'] for r in rows))}")
    print(f"result             : {dict(Counter(r['result'] for r in rows))}")

    by = defaultdict(list)
    for r in rows:
        by[r["owner_id"]].append(r)

    good, risky_only, dead = [], [], []
    for oid, rs in by.items():
        g = [r for r in rs if r["quality"] == "good"]
        if g:
            g.sort(key=score)
            good.append((oid, g[0]))
        elif any(r["quality"] == "risky" for r in rs):
            risky_only.append(oid)
        else:
            dead.append(oid)

    print()
    print(f"owners total          : {len(by)}")
    print(f"owners with >=1 GOOD  : {len(good)}")
    print(f"owners risky-only     : {len(risky_only)}")
    print(f"owners all dead       : {len(dead)}")
    print(f"name-matched winners  : {sum(1 for _, r in good if score(r)[0] < 0)}")

    keep, dropped, blanked = [], 0, 0
    for oid, r in sorted(good, key=lambda t: int(t[0])):
        f, l = (r.get("firstName") or "").strip(), (r.get("lastName") or "").strip()
        # last name is not alphabetic -> the "name" is a parsed street address
        if l and not NAME_RE.fullmatch(l):
            dropped += 1
            continue
        if f.lower() in ENTITY:
            dropped += 1
            continue
        if l.lower() in ENTITY:
            l = ""
            blanked += 1
        p = people.get(oid, {})
        keep.append([r["email"], f, l, p.get("propertyCity", ""), p.get("propertyState", "")])

    print(f"dropped, name unknown : {dropped}")
    print(f"lastName blanked      : {blanked}")
    print(f"FINAL SENDABLE        : {len(keep)}")

    up = os.path.join(outdir, f"{name} - INSTANTLY UPLOAD.csv")
    with open(up, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["email", "firstName", "lastName", "propertyCity", "propertyState"])
        w.writerows(keep)

    b2 = os.path.join(outdir, f"{name} - BATCH 2 (risky, hold).csv")
    with open(b2, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["email", "firstName", "lastName", "result", "propertyCity", "propertyState"])
        for oid in sorted(risky_only, key=int):
            rs = sorted([r for r in by[oid] if r["quality"] == "risky"], key=score)
            r = rs[0]
            p = people.get(oid, {})
            w.writerow([r["email"], r.get("firstName", ""), r.get("lastName", ""),
                        r.get("result", ""), p.get("propertyCity", ""), p.get("propertyState", "")])

    print()
    print("UPLOAD  ->", up)
    print("hold    ->", b2)


if __name__ == "__main__":
    main()
