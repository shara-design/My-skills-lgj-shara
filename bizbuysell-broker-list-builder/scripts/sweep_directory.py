# BizBuySell broker-directory sweep.
#
# RUN IT THROUGH browser-harness (helpers like new_tab/goto_url/js are pre-imported):
#     browser-harness < sweep_directory.py
#
# Configure STATES and OUT below, or set BBS_OUT / BBS_STATES env vars.
# Resumes automatically: existing broker_ids in OUT are skipped and preserved.

import json, time, random, csv, math, os, re, sys
from collections import Counter

# browser-harness injects these into globals before exec'ing this file.
# Bind them explicitly so static analysis is quiet and a standalone run fails loudly.
try:
    new_tab       = new_tab        # noqa: F821  (provided by browser-harness)
    goto_url      = goto_url       # noqa: F821
    wait_for_load = wait_for_load   # noqa: F821
    js            = js             # noqa: F821
except NameError:
    sys.exit("Run this through browser-harness:  browser-harness < sweep_directory.py")

OUT = os.environ.get("BBS_OUT", os.path.expanduser("~/Desktop/bizbuysell-brokers.csv"))

# slug, label. Totals are discovered from the page, not hardcoded.
STATES = [("california", "CA"), ("new-york", "NY"), ("new-jersey", "NJ"),
          ("colorado", "CO"), ("massachusetts", "MA"), ("minnesota", "MN"),
          ("wisconsin", "WI"), ("district-of-columbia", "DC"),
          ("hawaii", "HI"), ("vermont", "VT")]
SLUG2ABBR = {"alabama":"AL","alaska":"AK","arizona":"AZ","arkansas":"AR","california":"CA",
 "colorado":"CO","connecticut":"CT","delaware":"DE","district-of-columbia":"DC","florida":"FL",
 "georgia":"GA","hawaii":"HI","idaho":"ID","illinois":"IL","indiana":"IN","iowa":"IA",
 "kansas":"KS","kentucky":"KY","louisiana":"LA","maine":"ME","maryland":"MD","massachusetts":"MA",
 "michigan":"MI","minnesota":"MN","mississippi":"MS","missouri":"MO","montana":"MT",
 "nebraska":"NE","nevada":"NV","new-hampshire":"NH","new-jersey":"NJ","new-mexico":"NM",
 "new-york":"NY","north-carolina":"NC","north-dakota":"ND","ohio":"OH","oklahoma":"OK",
 "oregon":"OR","pennsylvania":"PA","rhode-island":"RI","south-carolina":"SC","south-dakota":"SD",
 "tennessee":"TN","texas":"TX","utah":"UT","vermont":"VT","virginia":"VA","washington":"WA",
 "west-virginia":"WV","wisconsin":"WI","wyoming":"WY"}

if os.environ.get("BBS_STATES"):
    STATES = [(s.strip(), SLUG2ABBR.get(s.strip(), s.strip()[:2].upper()))
              for s in os.environ["BBS_STATES"].split(",") if s.strip()]

TARGET = {lbl for _, lbl in STATES}

# ZIP first-3-digit ranges -> state. Extend when you extend STATES.
RANGES = {"CA":[(900,961)],"NY":[(100,149)],"NJ":[(70,89)],"CO":[(800,816)],
          "MA":[(10,27),(55,55)],"MN":[(550,567)],"WI":[(530,549)],
          "DC":[(200,205)],"HI":[(967,968)],"VT":[(50,59)],
          "CT":[(60,69)],"IL":[(600,629)],"MD":[(206,219)],"OR":[(970,979)],
          "PA":[(150,196)],"VA":[(220,246)],"WA":[(980,994)],"FL":[(320,349)],
          "TX":[(750,799)],"GA":[(300,319)],"NV":[(889,898)],"AZ":[(850,865)],
          "ME":[(39,49)],"DE":[(197,199)],"SC":[(290,299)],"RI":[(28,29)],
          "MT":[(590,599)],"NH":[(30,38)],"NM":[(870,884)],"UT":[(840,847)]}

def hq_state(z):
    z = "".join(c for c in str(z) if c.isdigit())
    if len(z) < 5:
        return ""                      # unknown, NOT excluded
    p = int(z[:3])
    for s, rs in RANGES.items():
        for a, b in rs:
            if a <= p <= b:
                return s
    return "OTHER"

COLS = ["broker_id","first_name","last_name","company","hq_state","city","zip","telephone",
        "company_url","for_sale_count","sold_count","response_score","languages",
        "found_on_page","profile_url"]

EXTRACT = r"""(()=>{
 const txt=document.body.innerText||'';
 if(/access denied|unusual traffic|captcha|are you a human/i.test(txt.slice(0,4000)))
   return JSON.stringify({abort:'BLOCK_TEXT'});
 if(txt.length<1500) return JSON.stringify({abort:'SHORT_BODY:'+txt.length});
 const el=document.getElementById('BBS-state');
 if(!el) return JSON.stringify({abort:'NO_BBS_STATE'});
 const j=JSON.parse(el.textContent);
 const k=Object.keys(j).find(x=>x.includes('brokerSearch'));
 if(!k) return JSON.stringify({abort:'NO_BROKERSEARCH_KEY'});
 const arr=(j[k].value.brokerSearchResult||{}).value||[];
 return JSON.stringify({path:location.pathname,
   showing:(txt.match(/Showing[^\n]*/)||[''])[0], n:arr.length,
   rows:arr.map(b=>({
     id:(String(b.url||'').match(/\/(\d+)\/$/)||[])[1]||'',
     fn:b.firstName||'', ln:b.lastName||'', co:b.companyName||'',
     city:b.city||'', zip:String(b.zip||''), tel:b.telephone||'',
     web:b.companyUrl||'', fs:b.forSaleListingsCount||0, sold:b.soldListingsCount||0,
     rs:b.messageResponseScore, lang:b.personLanguagesDescription||'', url:b.url||''
   }))});
})()"""

# ---- resume -----------------------------------------------------------------
rows, seen = [], set()
if os.path.exists(OUT):
    with open(OUT, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r.get("broker_id"):
                rows.append(r); seen.add(r["broker_id"])
    print(f"resuming: {len(rows)} brokers already in {OUT}", flush=True)

def flush():
    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLS, extrasaction="ignore")
        w.writeheader(); w.writerows(rows)

def load(url, first):
    for attempt in range(3):
        try:
            if first: new_tab(url)
            else:     goto_url(url)
            wait_for_load(); time.sleep(random.uniform(1.5, 2.5))
            return json.loads(js(EXTRACT))
        except Exception as e:
            time.sleep(4)
            if attempt == 2:
                print(f"  !! load failed {url} ({type(e).__name__})", flush=True)
    return None

# ---- sweep ------------------------------------------------------------------
first, loaded, zero_streak, ABORT = True, 0, 0, None
per_state, site_total = Counter(), {}

for slug, lbl in STATES:
    if ABORT: break
    d = load(f"https://www.bizbuysell.com/business-brokers/{slug}/", first); first = False
    if not d or d.get("abort"):
        ABORT = f"{lbl} p1: {(d or {}).get('abort','LOAD_FAIL')}"; break
    m = re.search(r"of\s+([\d,]+)\s+brokers", d.get("showing", "") or "")
    total = int(m.group(1).replace(",", "")) if m else 0
    site_total[lbl] = total
    pages = max(1, math.ceil(total / 30))

    for p in range(1, pages + 1):
        if p > 1:
            url = f"https://www.bizbuysell.com/business-brokers/{slug}/{p}/"
            d = load(url, False)
            if not d:
                zero_streak += 1
            elif d.get("abort"):
                ABORT = f"{lbl} p{p}: {d['abort']}"; break
        if d and not d.get("abort"):
            loaded += 1
            if d["n"] == 0:
                zero_streak += 1
            else:
                zero_streak = 0
                for r in d["rows"]:
                    if not r["id"] or r["id"] in seen: continue
                    seen.add(r["id"])
                    rows.append({"broker_id":r["id"],"first_name":r["fn"],"last_name":r["ln"],
                        "company":r["co"],"hq_state":hq_state(r["zip"]),"city":r["city"],
                        "zip":r["zip"],"telephone":r["tel"],"company_url":r["web"],
                        "for_sale_count":r["fs"],"sold_count":r["sold"],"response_score":r["rs"],
                        "languages":r["lang"],"found_on_page":lbl,
                        "profile_url":("https://www.bizbuysell.com"+r["url"]) if r["url"] else ""})
                    per_state[lbl] += 1
        if zero_streak >= 2:
            ABORT = f"{lbl} p{p}: TWO_CONSECUTIVE_EMPTY"; break
        if loaded % 10 == 0: flush()
        time.sleep(random.uniform(4.0, 8.0))

    print(f"{lbl:3} site={site_total.get(lbl,0):>5}  new_unique={per_state[lbl]:>5}  total={len(rows):>5}", flush=True)

flush()

# ---- report -----------------------------------------------------------------
print("\n" + "=" * 70, flush=True)
if ABORT: print(f"!!! ABORTED: {ABORT}   (partial CSV kept, re-run to resume)", flush=True)
raw = sum(site_total.values())
print(f"pages loaded         {loaded}", flush=True)
print(f"unique brokers       {len(rows)}   (raw state sum {raw})", flush=True)

# reconciliation: shortfalls should equal cross-state duplicates exactly
short = raw - len(rows)
print(f"cross-state dupes    {short}  <- if per-state shortfalls sum to this, capture was COMPLETE", flush=True)

inmap = [r for r in rows if r["hq_state"] not in ("", "OTHER")]
live  = [r for r in inmap if int(r["for_sale_count"] or 0) >= 1]
def pc(a): return f"{100.0*len(a)/len(rows):5.1f}%" if rows else "  n/a"
print(f"HQ in target states  {len(inmap):>5} {pc(inmap)}", flush=True)
print(f"  + live listings    {len(live):>5} {pc(live)}   <== QUALIFIED", flush=True)
print(f"     w/ telephone    {sum(1 for r in live if r['telephone']):>5}", flush=True)
print(f"     w/ company_url  {sum(1 for r in live if r['company_url']):>5}", flush=True)
print(f"\nunknown-location (kept, not dropped): {sum(1 for r in rows if r['hq_state']=='')}", flush=True)
print(f"WROTE {OUT}", flush=True)
