import { defineConfig } from "vite";
import openvite from "openvite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    openvite(),
    cloudflare(),
  ],
});
