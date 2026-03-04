import { defineConfig } from "vite";
import openvite from "openvite";

export default defineConfig({
  plugins: [openvite({ appDir: import.meta.dirname })],
});
