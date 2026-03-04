import { defineConfig } from "vite";
import openvite from "openvite";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    openvite(),
    nitro(),
  ],
});
