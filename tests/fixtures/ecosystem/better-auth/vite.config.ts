import { defineConfig } from "vite";
import openvite from "openvite";

export default defineConfig({
  plugins: [openvite()],
  ssr: {
    // Force better-auth through Vite's transform pipeline so our next/* aliases
    // work when better-auth/next-js does import("next/headers")
    noExternal: ["better-auth"],
  },
});
