#!/bin/bash
# blacklist-check — domain blacklist checker (same DNSBL lookups MXToolbox performs).
# Checks each domain against SURBL multi (the list that matters for cold-email domains),
# with a 3-state result so a "CLEAN" is never guessed from a timeout.
#
# Usage:   ./dblcheck.sh <input-file>          # human-readable output
#          ./dblcheck.sh <input-file> csv       # CSV output (domain,result)
#
# Input can be ANY of: raw domains (one per line), a mailbox list (dor@getshifft.com),
# or a full CSV export (it pulls domains out of the Email column automatically).
#
# Optional: export SPAMHAUS_DQS_KEY=xxxx   -> also checks Spamhaus DBL (private zone,
#           no rate-limiting). Free key at spamhaus.com. Without it, Spamhaus is
#           blocked from normal networks and is skipped.
#
# Tunables: PAR (parallel lookups, default 12), RETRIES (per domain, default 6)

PAR=${PAR:-12}; RETRIES=${RETRIES:-6}
CSV=0; [ "$2" = "csv" ] && CSV=1
WORK=$(mktemp -d); trap 'rm -rf "$WORK"' EXIT
[ -z "$1" ] && { echo "usage: $0 <input-file> [csv]" >&2; exit 1; }

# --- 1. Extract domains from anything: emails (domain after @) OR bare domain lines
{ grep -oE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' "$1" | sed 's/.*@//'
  grep -vE '@' "$1" | sed -E 's/[[:space:]]//g; s#^https?://##; s#^www\.##; s#/.*$##'
} 2>/dev/null | tr 'A-Z' 'a-z' | grep -E '^[a-z0-9.-]+\.[a-z]{2,}$' | sort -u > "$WORK/domains"
TOTAL=$(wc -l < "$WORK/domains" | tr -d ' ')
echo "Checking $TOTAL domains on SURBL multi${SPAMHAUS_DQS_KEY:+ + Spamhaus DBL}..." >&2
[ "$TOTAL" -eq 0 ] && { echo "No valid domains found in $1" >&2; exit 1; }

# --- 2. Three-state check per (domain,list): LISTED / CLEAN / UNKNOWN.
# 127.0.0.1 = query refused, 127.0.0.254 = blocked resolver -> NOT listings.
check_one() {
  local d="$1" bl="$2" i=0 out ans
  while [ "$i" -lt "${RETRIES:-6}" ]; do
    out=$(dig +short +time=4 +tries=1 "$d.$bl" A 2>/dev/null)
    ans=$(echo "$out" | grep -E '^127\.' | head -1)
    if [ -n "$ans" ]; then
      { [ "$ans" = "127.0.0.1" ] || [ "$ans" = "127.0.0.254" ]; } && { echo "UNKNOWN"; return; }
      echo "LISTED:$ans"; return
    fi
    if dig +time=4 +tries=1 "$d.$bl" A 2>/dev/null | grep -qE "status: NXDOMAIN|ANSWER: 0"; then
      echo "CLEAN"; return
    fi
    i=$((i+1)); sleep 0.3
  done
  echo "UNKNOWN"
}
export -f check_one; export RETRIES SPAMHAUS_DQS_KEY

run() {
  d="$1"; res="$(check_one "$d" multi.surbl.org)"
  [ -n "$SPAMHAUS_DQS_KEY" ] && res="$res;DBL=$(check_one "$d" ${SPAMHAUS_DQS_KEY}.dbl.dq.spamhaus.net)"
  echo "$d,$res"
}
export -f run

# --- 3. Run in parallel, print report
if [ "$CSV" -eq 1 ]; then echo "domain,result"; fi
xargs -P "$PAR" -I{} bash -c 'run "$@"' _ {} < "$WORK/domains" | sort > "$WORK/out"

if [ "$CSV" -eq 1 ]; then
  cat "$WORK/out"
else
  awk -F, '{printf "  %-40s %s\n", $1, $2}' "$WORK/out"
fi

L=$(grep -c ',LISTED' "$WORK/out" || true)
C=$(grep -c ',CLEAN'  "$WORK/out" || true)
U=$(grep -c ',UNKNOWN' "$WORK/out" || true)
echo "--- $TOTAL domains: $L listed, $C clean, $U unknown ---" >&2
