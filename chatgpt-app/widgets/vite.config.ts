import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from "path";

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    rollupOptions: {
      input: {
        "chapter-list":       resolve(__dirname, "src/ChapterList/entry.html"),
        "chapter-reader":     resolve(__dirname, "src/ChapterReader/entry.html"),
        "quiz-panel":         resolve(__dirname, "src/QuizPanel/entry.html"),
        "progress-dashboard": resolve(__dirname, "src/ProgressDashboard/entry.html"),
        "search-results":     resolve(__dirname, "src/SearchResults/entry.html"),
        "access-status":      resolve(__dirname, "src/AccessStatus/entry.html"),
      },
    },
    outDir: "dist",
    assetsInlineLimit: Infinity,
  },
});
