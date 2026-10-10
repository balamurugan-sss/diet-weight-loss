import { loadCatalogue } from "./lib/catalogue";

async function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const report = await loadCatalogue();
  const scoped = (file: string) => !only.length || only.some((o) => file.includes(o));

  for (const issue of report.ingredientIssues) console.log(`⚠ ingredient: ${issue}`);
  const errs = report.errors.filter((e) => scoped(e.file));
  for (const e of errs) {
    console.log(`✗ ${e.file} → ${e.id}`);
    for (const m of e.errors) console.log(`    - ${m}`);
  }
  const recipes = report.recipes.filter((r) => scoped(r.batch.file));
  for (const r of recipes) for (const w of r.warnings) console.log(`⚠ ${r.id}: ${w}`);
  for (const d of report.duplicates) console.log(`✗ near-duplicate: ${d.a} ≈ ${d.b} (${d.reason})`);

  if (process.argv.includes("--table")) {
    for (const r of recipes) {
      const p = r.perServing;
      console.log(
        `${r.id.padEnd(44)} ${String(p.kcal).padStart(4)} kcal  P${String(p.proteinG).padStart(5)}  net${String(p.netCarbsG).padStart(5)}  F${String(p.fatG).padStart(5)}  ₹${String(r.costPerServingInr).padStart(3)}  ${r.dietType.padEnd(14)} ${r.isKeto ? "KETO " : ""}${r.isLowCarb ? "LC " : ""}${r.isHighProtein ? "HP" : ""}`,
      );
    }
  }
  const counts = (k: (r: (typeof recipes)[number]) => boolean) => recipes.filter(k).length;
  console.log(
    `\n${recipes.length} valid recipes, ${errs.length} rejected, ${report.duplicates.length} near-duplicates` +
      ` | keto ${counts((r) => r.isKeto)}, low-carb ${counts((r) => r.isLowCarb)}, high-protein ${counts((r) => r.isHighProtein)}`,
  );
  return errs.length || report.duplicates.length ? 1 : 0;
}

main().then((code) => process.exit(code));
