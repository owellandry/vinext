import { defineConfig } from "vite";
import openvite from "openvite";

export default defineConfig({
  plugins: [openvite()],
  ssr: {
    // Force nuqs through Vite's transform pipeline so our next/* aliases work
    noExternal: ["nuqs"],
  },
});
