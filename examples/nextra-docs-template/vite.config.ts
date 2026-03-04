import { defineConfig } from "vite";
import openvite from "openvite";
import mdx from "@mdx-js/rollup";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    // MDX support — compiles .mdx files into React components
    mdx(),

    // openvite plugin (provides all next/* shims, routing, SSR, RSC)
    openvite(),

    // Cloudflare Workers plugin — builds for workerd runtime
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
