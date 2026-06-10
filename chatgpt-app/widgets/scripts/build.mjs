import { build } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import react from "@vitejs/plugin-react";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { rmSync, copyFileSync, mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const WIDGETS = [
  { name: "chapter-list",       dir: "ChapterList" },
  { name: "chapter-reader",     dir: "ChapterReader" },
  { name: "quiz-panel",         dir: "QuizPanel" },
  { name: "progress-dashboard", dir: "ProgressDashboard" },
  { name: "search-results",     dir: "SearchResults" },
  { name: "access-status",      dir: "AccessStatus" },
];

// Clear dist before building
try {
  rmSync(resolve(root, "dist"), { recursive: true, force: true });
} catch { /* ignore */ }

mkdirSync(resolve(root, "dist"), { recursive: true });

for (const widget of WIDGETS) {
  const tmpDir = resolve(root, "dist", `_tmp_${widget.name}`);

  await build({
    root,
    plugins: [react(), viteSingleFile()],
    build: {
      rollupOptions: {
        input: resolve(root, "src", widget.dir, "entry.html"),
      },
      outDir: tmpDir,
      emptyOutDir: true,
      assetsInlineLimit: Infinity,
    },
    logLevel: "warn",
  });

  // viteSingleFile outputs the HTML at the same relative path as input under outDir
  const srcHtml = resolve(tmpDir, "src", widget.dir, "entry.html");
  const dstHtml = resolve(root, "dist", `${widget.name}.html`);
  copyFileSync(srcHtml, dstHtml);

  rmSync(tmpDir, { recursive: true, force: true });
  console.log(`✓ ${widget.name}.html`);
}
