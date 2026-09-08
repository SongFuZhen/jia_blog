import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const BASE = env.IMGBED_URL || "https://cloudflare-imgbed-91r.pages.dev";
const TOKEN = env.IMGBED_API_TOKEN;
const headers = { Authorization: `Bearer ${TOKEN}` };

for (let page = 1; page <= 3; page++) {
  const res = await fetch(`${BASE}/api/manage/list?page=${page}&limit=20`, { headers });
  const data = await res.json();
  console.log(`--- page ${page} ---`);
  console.log("total:", data.total_count ?? data.total ?? "?");
  for (const f of data.files ?? []) {
    console.log(f.name, "| dir:", JSON.stringify(f.metadata?.Directory));
  }
}
