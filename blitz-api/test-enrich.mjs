import { readFileSync } from "node:fs";
const KEY = process.env.BLITZ_API_KEY, BASE = process.env.BLITZ_BASE_URL;
const sleep = ms => new Promise(r => setTimeout(r, ms));
function pc(t){const R=[];let f=[],c="",q=false;for(let i=0;i<t.length;i++){const x=t[i];if(q){if(x==='"'){if(t[i+1]==='"'){c+='"';i++}else q=false}else c+=x}else{if(x==='"')q=true;else if(x===','){f.push(c);c=""}else if(x==='\n'){f.push(c);R.push(f);f=[];c=""}else if(x==='\r'){}else c+=x}}if(c!==""||f.length){f.push(c);R.push(f)}return R}
const r = pc(readFileSync(process.argv[2], "utf8"));
const h = r[0], ei = h.indexOf("email"), li = h.indexOf("linkedin_url");
const blanks = r.slice(1).filter(x => x.length >= h.length && !x[ei] && x[li]).map(x => x[li]);
// fresh deep slice (past the known-misses)
const sample = blanks.slice(2000, 2040);

let _last = 0;
async function gate(){ const MIN = 350; const now = Date.now(); const wait = Math.max(0, _last + MIN - now); _last = now + wait; if (wait) await sleep(wait); }
async function call(u, attempt = 0){
  await gate();
  try {
    const res = await fetch(BASE + "/v2/enrichment/email", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": KEY }, body: JSON.stringify({ person_linkedin_url: u }) });
    if (!res.ok) { const e = new Error(res.status); e.status = res.status; throw e; }
    return res.json();
  } catch (e) {
    if (attempt < 7 && (e.status === 429 || e.status >= 500)) { await sleep(Math.min(20000, 1200 * 2 ** attempt)); return call(u, attempt + 1); }
    return { _err: e.status || "err" };
  }
}
let found = 0, err = 0, done = 0;
const queue = [...sample];
async function worker(){ while (queue.length){ const u = queue.shift(); const j = await call(u); if (j._err) err++; else if (j.found) found++; done++; } }
const t0 = Date.now();
await Promise.all([worker(), worker(), worker()]);
console.log(`burst ${sample.length} calls @ conc3/gate350: found=${found} (${Math.round(found/sample.length*100)}%), errors_after_retry=${err}, ${(((Date.now()-t0)/1000)).toFixed(1)}s -> ${(sample.length/((Date.now()-t0)/1000)).toFixed(2)} req/s`);
