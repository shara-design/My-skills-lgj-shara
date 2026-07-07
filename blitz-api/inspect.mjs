import { readFileSync } from "node:fs";

function parseCSV(t) {
  const rows = []; let f = [], cur = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") { f.push(cur); cur = ""; }
      else if (c === "\n") { f.push(cur); rows.push(f); f = []; cur = ""; }
      else if (c === "\r") { /* skip */ }
      else cur += c;
    }
  }
  if (cur !== "" || f.length) { f.push(cur); rows.push(f); }
  return rows;
}

const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${String(v).padStart(4)}  ${k}`).join("\n   ");

for (const seg of process.argv.slice(2)) {
  const rows = parseCSV(readFileSync(seg, "utf8"));
  const hdr = rows[0]; const idx = Object.fromEntries(hdr.map((h, i) => [h, i]));
  const data = rows.slice(1).filter(r => r.length >= hdr.length && r[idx.first_name]);
  const states = {}, comps = {}, titles = {}; let vp = 0, offfunc = 0;
  const offRe = /communications|marketing|environmental|planning|human resources|\bhr\b|talent|recruit|software|\bit\b|accountant|controller|sustainability|business development|sales/i;
  for (const r of data) {
    const st = r[idx.state_code] || ""; states[st] = (states[st] || 0) + 1;
    const co = r[idx.company_name] || ""; comps[co] = (comps[co] || 0) + 1;
    const jt = r[idx.job_title] || ""; titles[jt] = (titles[jt] || 0) + 1;
    if (/vice president|\bvp\b/i.test(jt)) vp++;
    if (offRe.test(jt)) offfunc++;
  }
  console.log("=========", seg, "=========");
  console.log("rows:", data.length, "| state_code:", JSON.stringify(states));
  console.log("titles w/ VP:", vp, "| titles w/ off-ICP function keyword:", offfunc);
  console.log("top companies:\n  ", top(comps, 10));
  console.log("top titles:\n  ", top(titles, 12));
  console.log();
}
