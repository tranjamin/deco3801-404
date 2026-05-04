import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: "popup.html",
        report: "report.html",
        settings: "settings.html",
        policies: "policies.html",
        tls_retrieval_engine: "src/tls_retrieval_engine.ts"
      },
      output: {
        entryFileNames: "[name].js"
      }
    }
  }
});