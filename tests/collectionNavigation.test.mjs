import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const execFileAsync = promisify(execFile);
const packageJson = JSON.parse(
  await readFile(join(repositoryRoot, "package.json"), "utf8")
);

const getAvailablePort = () =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close((error) => {
        if (error) reject(error);
        else resolve(address.port);
      });
    });
  });

const waitForServer = async (url, attempts = 50) => {
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw lastError ?? new Error(`Server did not become ready at ${url}`);
};

test("production server resolves Astro collection routes instead of the homepage fallback", async (t) => {
  assert.equal(
    packageJson.scripts["start:production"],
    "serve dist -l tcp://0.0.0.0:$PORT"
  );

  await execFileAsync(
    process.execPath,
    [join(repositoryRoot, "node_modules", "astro", "bin", "astro.mjs"), "build"],
    {
      cwd: repositoryRoot,
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
    }
  );

  const port = await getAvailablePort();
  const serveCli = join(repositoryRoot, "node_modules", "serve", "build", "main.js");
  const child = spawn(
    process.execPath,
    [serveCli, "dist", "-l", `tcp://127.0.0.1:${port}`],
    {
      cwd: repositoryRoot,
      stdio: "ignore",
      windowsHide: true,
    }
  );

  t.after(() => {
    if (!child.killed) child.kill();
  });

  const origin = `http://127.0.0.1:${port}`;
  await waitForServer(origin);

  const routes = [
    ["/collections/rolex", "Rolex | Quest Luxo"],
    ["/collections/rolex/datejust", "Rolex Datejust | Quest Luxo"],
    ["/collections/rolex/day-date", "Rolex Day-Date | Quest Luxo"],
    ["/collections/rolex/daytona", "Rolex Daytona | Quest Luxo"],
    ["/collections/rolex/gmt-master-ii", "Rolex GMT-Master II | Quest Luxo"],
    ["/collections/rolex/sky-dweller", "Rolex Sky-Dweller | Quest Luxo"],
    ["/collections/rolex/submariner", "Rolex Submariner | Quest Luxo"],
    ["/collections/rolex/yacht-master", "Rolex Yacht-Master | Quest Luxo"],
  ];

  for (const [route, expectedTitle] of routes) {
    const response = await fetch(`${origin}${route}`);
    const html = await response.text();

    assert.equal(response.status, 200, route);
    assert.match(html, new RegExp(`<title>${expectedTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</title>`), route);
    assert.doesNotMatch(
      html,
      /Acquire Exceptional Timepieces Through a Trusted Global Sourcing Network/,
      route
    );
  }
});
