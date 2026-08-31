#!/usr/bin/env python3
"""
Stage 1: PropStream skip-traced export -> MillionVerifier upload file + owner map.

Usage:
    python3 prepare_verify.py <raw_export.csv> <output_dir> <list_name>

Writes:
    <list_name> - VERIFY these emails.csv   <- user uploads this
    <list_name> - MAP.csv                   <- stage 3 joins on this

Never modifies the input file.
"""
import csv, os, re, sys
from collections import Counter

NAME_RE = re.compile(r"[A-Za-z][A-Za-z'\-. ]*$")


def find_col(fieldnames, *candidates):
    """Case/space-insensitive column lookup."""
    norm = {re.sub(r"[^a-z0-9]", "", (f or "").lower()): f for f in fieldnames}
    for c in candidates:
        k = re.sub(r"[^a-z0-9]", "", c.lower())
        if k in norm:
            return norm[k]
    return None


def usable_name(s):
    s = (s or "").strip()
    return len(s) >= 2 and bool(NAME_RE.fullmatch(s))


def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    src, outdir, name = sys.argv[1], sys.argv[2], sys.argv[3]
    os.makedirs(outdir, exist_ok=True)

    rows = list(csv.DictReader(open(src, encoding="utf-8-sig")))
    if not rows:
        sys.exit("empty input")
    fn = rows[0].keys()

    c_first = find_col(fn, "First Name", "FirstName", "Owner First Name")
    c_last = find_col(fn, "Last Name", "LastName", "Owner Last Name")
    c_lit = find_col(fn, "Litigator")
    c_addr = find_col(fn, "Street Address", "Property Address", "Address")
    c_city = find_col(fn, "City", "Property City")
    c_state = find_col(fn, "State", "Property State")
    c_zip = find_col(fn, "Zip", "Zip Code", "Property Zip")
    email_cols = [f for f in fn if re.fullmatch(r"email\s*\d*", (f or "").strip().lower())]
    email_cols.sort(key=lambda f: int(re.sub(r"\D", "", f) or 1))

    if not c_first or not email_cols:
        sys.exit(f"could not find name/email columns. header was:\n{list(fn)}")

    print(f"input rows          : {len(rows)}")
    print(f"first/last columns  : {c_first!r} / {c_last!r}")
    print(f"email columns       : {email_cols}")
    print(f"litigator column    : {c_lit!r}")

    populated = Counter()
    for r in rows:
        for c in email_cols:
            if (r.get(c) or "").strip():
                populated[c] += 1
    for c in email_cols:
        print(f"  {c:10} populated: {populated[c]}")
    empty = [c for c in email_cols if populated[c] == 0]
    if empty:
        print(f"  (ignoring always-empty: {empty})")
        email_cols = [c for c in email_cols if populated[c]]

    people, seen = [], set()
    no_email = bad_name = litigator = dupe = 0

    for r in rows:
        emails, s = [], set()
        for c in email_cols:
            e = (r.get(c) or "").strip().lower()
            if e and "@" in e and e not in s:
                s.add(e)
                emails.append(e)
        if not emails:
            no_email += 1
            continue

        first = (r.get(c_first) or "").strip()
        last = (r.get(c_last) or "").strip()
        if not usable_name(first):
            bad_name += 1
            continue
        # PropStream writes the literal word "Litigator", not yes/no.
        # Any non-empty value in this column means flagged.
        if c_lit and (r.get(c_lit) or "").strip():
            litigator += 1
            continue

        key = (first.lower(), last.lower())
        if key in seen:
            dupe += 1
            continue
        seen.add(key)

        people.append({
            "firstName": first.title() if first.isupper() or first.islower() else first,
            "lastName": last.title() if last.isupper() or last.islower() else last,
            "emails": emails,
            "propertyAddress": (r.get(c_addr) or "").strip() if c_addr else "",
            "propertyCity": (r.get(c_city) or "").strip() if c_city else "",
            "propertyState": (r.get(c_state) or "").strip() if c_state else "",
            "propertyZip": (r.get(c_zip) or "").strip() if c_zip else "",
        })

    print()
    print(f"dropped, no email     : {no_email}")
    print(f"dropped, bad first    : {bad_name}")
    print(f"dropped, litigator    : {litigator}")
    print(f"dropped, duplicate own: {dupe}")
    print(f"OWNERS                : {len(people)}")

    vpath = os.path.join(outdir, f"{name} - VERIFY these emails.csv")
    mpath = os.path.join(outdir, f"{name} - MAP.csv")
    n = 0
    with open(vpath, "w", newline="", encoding="utf-8") as vf, \
         open(mpath, "w", newline="", encoding="utf-8") as mf:
        v = csv.writer(vf)
        v.writerow(["owner_id", "slot", "email", "firstName", "lastName"])
        m = csv.writer(mf)
        m.writerow(["owner_id", "firstName", "lastName",
                    "propertyAddress", "propertyCity", "propertyState", "propertyZip"])
        for i, p in enumerate(people, 1):
            for slot, e in enumerate(p["emails"], 1):
                v.writerow([i, slot, e, p["firstName"], p["lastName"]])
                n += 1
            m.writerow([i, p["firstName"], p["lastName"], p["propertyAddress"],
                        p["propertyCity"], p["propertyState"], p["propertyZip"]])

    print(f"ADDRESSES TO VERIFY   : {n}")
    print(f"est. cost @ $0.001/em : ${n * 0.001:,.2f}")
    print()
    print("UPLOAD  ->", vpath)
    print("keep    ->", mpath)


if __name__ == "__main__":
    main()
