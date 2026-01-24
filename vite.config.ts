import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost", // Use localhost instead of ::
    port: 8080,
    strictPort: true,
    hmr: {
      overlay: true, // Turn this ON so you can see what's wrong
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));