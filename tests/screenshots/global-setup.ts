import { spawn } from "node:child_process";

export default function globalSetup(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
    "node",
    ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "scripts/seed-screenshots.mts"],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`screenshot seed exited with ${code ?? "no code"}`));
    });
  });
}
