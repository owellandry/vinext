import { readFileSync } from "node:fs";
const data = JSON.parse(readFileSync(process.argv[2] || "/tmp/vitest-results.json", "utf8"));
const files = data.testResults
  .map((f) => ({
    file: f.name.replace(/.*[/\\]tests[/\\]/, "tests/").replace(/\\/g, "/"),
    duration: f.endTime - f.startTime,
    tests: f.assertionResults.length,
  }))
  .sort((a, b) => b.duration - a.duration);

console.log("Top 20 slowest test files:\n");
for (const f of files.slice(0, 20)) {
  const s = String(Math.round(f.duration / 1000)).padStart(4);
  const t = String(f.tests).padStart(3);
  console.log(`  ${s}s  (${t} tests)  ${f.file}`);
}
const total = Math.round(files.reduce((s, f) => s + f.duration, 0) / 1000);
console.log(`\nTotal: ${total}s across ${files.length} files`);
