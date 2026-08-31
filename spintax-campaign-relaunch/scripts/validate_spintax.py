#!/usr/bin/env python3
"""
Validate Bison spintax integrity + naturalness scaffolding.

Usage:
  python3 validate_spintax.py <sequence.json>       # a {"sequence_steps":[...]} file (Bison shape)
  echo '<text>' | python3 validate_spintax.py -      # validate a single body/subject from stdin

Checks per field (subject + body of every step):
  - braces balanced
  - no nested braces  {a {b|c}|d}
  - every spin block has a pipe
  - no empty options  {a|}  or  {|b}
  - no duplicate options  {same|same}
  - every brace-without-pipe is a known merge tag (else flagged)
Also prints, per step: number of spin groups in the body, paragraph breaks (<p><br></p>),
and the total body combination count (product of option counts).

Exit code 0 = clean, 1 = issues found.
"""
import json, re, sys

TOKENS = {"FIRST_NAME", "COMPANY", "COMPANY_NAME", "SENDER_EMAIL_SIGNATURE", "CITY",
          "LAST_NAME", "TITLE", "EMAIL"}
GROUP = re.compile(r"\{[^{}]*\}")

def check(label, text, issues):
    if text.count("{") != text.count("}"):
        issues.append(f"{label}: unbalanced braces")
    depth = 0
    for ch in text:
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
        if depth > 1:
            issues.append(f"{label}: NESTED braces")
            break
    for g in re.findall(r"\{([^{}]*)\}", text):
        if "|" not in g:
            if g not in TOKENS:
                issues.append(f"{label}: brace without pipe and not a known token -> '{g}'")
            continue
        opts = g.split("|")
        if any(o.strip() == "" for o in opts):
            issues.append(f"{label}: EMPTY option in {{{g}}}")
        if len(set(o.strip() for o in opts)) < len(opts):
            issues.append(f"{label}: DUPLICATE option in {{{g}}}")

def body_combos(text):
    total = 1
    for g in re.findall(r"\{([^{}]*)\}", text):
        if "|" in g:
            total *= len(g.split("|"))
    return total

def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(2)
    issues = []
    if sys.argv[1] == "-":
        text = sys.stdin.read()
        check("stdin", text, issues)
        print(f"combos={body_combos(text)}")
    else:
        data = json.load(open(sys.argv[1]))
        steps = data.get("sequence_steps") or data.get("data", {}).get("sequence_steps", [])
        for s in sorted(steps, key=lambda x: x.get("order", 0)):
            o = s.get("order")
            check(f"step{o}:subject", s.get("email_subject", ""), issues)
            check(f"step{o}:body", s.get("email_body", ""), issues)
            body = s.get("email_body", "")
            ngroups = len(GROUP.findall(body))
            breaks = body.count("<p><br></p>")
            print(f"step {o}: spin_groups={ngroups} para_breaks={breaks} body_combos={body_combos(body)}")
    print()
    if issues:
        print("SPINTAX ISSUES:")
        for i in issues:
            print("  -", i)
        sys.exit(1)
    print("SPINTAX: clean")
    sys.exit(0)

if __name__ == "__main__":
    main()
