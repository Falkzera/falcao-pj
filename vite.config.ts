import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    // Porta própria: o localStorage é por origem, e dividir a 5173 com outro app
    // misturaria preferências guardadas pelos dois.
    port: Number(process.env.PORT) || 5188,
  },
});
