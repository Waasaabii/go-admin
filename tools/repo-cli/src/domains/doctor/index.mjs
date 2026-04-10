import { runCommand } from "../../shared/process.mjs";
import { inspectProjectAir } from "../runtime/backend-dev.mjs";
import { printDivider, printField, printSection } from "../../shared/output.mjs";

export function doctorReport(context) {
  const items = [
    { name: "go", command: "go", args: ["version"] },
    { name: "node", command: "node", args: ["--version"] },
    { name: "pnpm", command: "pnpm", args: ["--version"] },
    { name: "brew", command: "brew", args: ["--version"] },
    { name: "docker", command: "docker", args: ["--version"] },
    { name: "docker compose", command: "docker", args: ["compose", "version"] },
  ];
  const report = items.map((item) => {
    const result = runCommand(item.command, item.args);
    const output = `${result.stdout}${result.stderr}`.trim();
    return {
      name: item.name,
      output,
      ok: result.code === 0,
    };
  });
  if (context) {
    const air = inspectProjectAir(context);
    report.push({
      name: "air (project)",
      output: air.summary,
      ok: true,
    });
  }
  return report;
}

export function runDoctor(context) {
  printSection("环境检查");
  const missing = [];
  for (const item of doctorReport(context)) {
    if (item.ok) {
      printField(item.name, item.output);
    } else {
      missing.push(item.name);
      printField(item.name, "缺失或不可用");
    }
  }
  printDivider();
  printField("结果", missing.length === 0 ? "必需环境已齐全" : `存在缺失项：${missing.join(", ")}`);
}
