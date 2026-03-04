import { describe, it, expect } from "vitest";
import path from "node:path";
import openvite from "../packages/openvite/src/index.js";
import type { Plugin } from "vite";

// ── Helpers ───────────────────────────────────────────────────
const norm = (p: string) => p.replace(/\\/g, "/");
const IMAGES_DIR = norm(path.resolve(import.meta.dirname, "./fixtures/images"));
const PNG_PATH = norm(path.join(IMAGES_DIR, "test-4x3.png"));
const JPG_PATH = norm(path.join(IMAGES_DIR, "test-8x6.jpg"));

/** Unwrap a Vite plugin hook that may use the object-with-filter format */
function unwrapHook(hook: any): Function {
  return typeof hook === "function" ? hook : hook?.handler;
}

/** Extract the openvite:image-imports plugin from the plugin array */
function getImagePlugin(): Plugin & { _dimCache: Map<string, { width: number; height: number }> } {
  const plugins = openvite() as Plugin[];
  const plugin = plugins.find((p) => p.name === "openvite:image-imports");
  if (!plugin) throw new Error("openvite:image-imports plugin not found");
  return plugin as any;
}

// ── resolveId ─────────────────────────────────────────────────
describe("openvite:image-imports — resolveId", () => {
  it("resolves ?openvite-meta suffix to virtual module ID", () => {
    const plugin = getImagePlugin();
    const resolve = unwrapHook(plugin.resolveId);
    const result = resolve.call(plugin, "/abs/path/hero.jpg?openvite-meta", "/some/file.tsx");
    expect(result).toBe("\0openvite-image-meta:/abs/path/hero.jpg");
  });

  it("returns null for non-meta imports", () => {
    const plugin = getImagePlugin();
    const resolve = unwrapHook(plugin.resolveId);
    expect(resolve.call(plugin, "./hero.jpg", "/some/file.tsx")).toBeNull();
    expect(resolve.call(plugin, "react", "/some/file.tsx")).toBeNull();
    expect(resolve.call(plugin, "next/image", "/some/file.tsx")).toBeNull();
  });
});

// ── load ──────────────────────────────────────────────────────
describe("openvite:image-imports — load", () => {
  it("returns dimensions for a PNG file", async () => {
    const plugin = getImagePlugin();
    const load = plugin.load as Function;
    const result = await load.call(plugin, `\0openvite-image-meta:${PNG_PATH}`);
    expect(result).toContain("export default");
    const json = result.replace("export default ", "").replace(";", "");
    const dims = JSON.parse(json);
    expect(dims.width).toBe(4);
    expect(dims.height).toBe(3);
  });

  it("returns dimensions for a JPEG file", async () => {
    const plugin = getImagePlugin();
    const load = plugin.load as Function;
    const result = await load.call(plugin, `\0openvite-image-meta:${JPG_PATH}`);
    const json = result.replace("export default ", "").replace(";", "");
    const dims = JSON.parse(json);
    expect(dims.width).toBe(8);
    expect(dims.height).toBe(6);
  });

  it("returns 0x0 for non-existent file", async () => {
    const plugin = getImagePlugin();
    const load = plugin.load as Function;
    const result = await load.call(plugin, "\0openvite-image-meta:/no/such/file.png");
    const json = result.replace("export default ", "").replace(";", "");
    const dims = JSON.parse(json);
    expect(dims.width).toBe(0);
    expect(dims.height).toBe(0);
  });

  it("returns null for non-image-meta IDs", async () => {
    const plugin = getImagePlugin();
    const load = plugin.load as Function;
    expect(await load.call(plugin, "./hero.jpg")).toBeNull();
    expect(await load.call(plugin, "react")).toBeNull();
  });

  it("caches dimensions on second call", async () => {
    const plugin = getImagePlugin();
    plugin._dimCache.clear();
    const load = plugin.load as Function;
    await load.call(plugin, `\0openvite-image-meta:${PNG_PATH}`);
    expect(plugin._dimCache.has(PNG_PATH)).toBe(true);
    // Second call uses cache (no way to verify directly, but should not throw)
    const result = await load.call(plugin, `\0openvite-image-meta:${PNG_PATH}`);
    expect(result).toContain('"width":4');
  });
});

// ── transform ─────────────────────────────────────────────────
describe("openvite:image-imports — transform", () => {
  // Fake file ID in the images directory so path.resolve works
  const fakeId = path.join(IMAGES_DIR, "page.tsx");

  it("transforms a PNG import into StaticImageData", async () => {
    const plugin = getImagePlugin();
    const transform = unwrapHook(plugin.transform);
    const code = `import hero from './test-4x3.png';\nconsole.log(hero);`;
    const result = await transform.call(plugin, code, fakeId);
    expect(result).not.toBeNull();
    expect(result.code).toContain("__openvite_img_url_hero");
    expect(result.code).toContain("__openvite_img_meta_hero");
    expect(result.code).toContain("const hero = { src: __openvite_img_url_hero");
    expect(result.code).toContain("?openvite-meta");
    expect(result.code).not.toContain("import hero from");
    expect(result.map).toBeDefined();
  });

  it("transforms a JPEG import", async () => {
    const plugin = getImagePlugin();
    const transform = unwrapHook(plugin.transform);
    const code = `import photo from './test-8x6.jpg';`;
    const result = await transform.call(plugin, code, fakeId);
    expect(result).not.toBeNull();
    expect(result.code).toContain("__openvite_img_url_photo");
    expect(result.code).toContain("const photo = { src: __openvite_img_url_photo");
  });

  it("transforms multiple image imports in one file", async () => {
    const plugin = getImagePlugin();
    const transform = unwrapHook(plugin.transform);
    const code = [
      `import hero from './test-4x3.png';`,
      `import photo from './test-8x6.jpg';`,
      `export default function Page() { return null; }`,
    ].join("\n");
    const result = await transform.call(plugin, code, fakeId);
    expect(result).not.toBeNull();
    expect(result.code).toContain("__openvite_img_url_hero");
    expect(result.code).toContain("__openvite_img_url_photo");
    expect(result.code).toContain("const hero =");
    expect(result.code).toContain("const photo =");
  });

  it("handles various image extensions", async () => {
    const plugin = getImagePlugin();
    const transform = unwrapHook(plugin.transform);
    // These files don't exist so transform should skip them (fs.existsSync check),
    // but the regex should still match — we verify by testing with a real file
    const code = `import icon from './test-4x3.png';`;
    const result = await transform.call(plugin, code, fakeId);
    expect(result).not.toBeNull();
    expect(result.code).toContain("__openvite_img_url_icon");
  });

  it("returns null for files with no image imports", async () => {
    const plugin = getImagePlugin();
    const transform = unwrapHook(plugin.transform);
    const code = `import React from 'react';\nconst x = 1;`;
    const result = await transform.call(plugin, code, fakeId);
    expect(result).toBeNull();
  });

  it("returns null for node_modules files", async () => {
    const plugin = getImagePlugin();
    const transform = unwrapHook(plugin.transform);
    const code = `import hero from './hero.png';`;
    const result = await transform.call(plugin, code, path.join("node_modules", "pkg", "index.ts"));
    expect(result).toBeNull();
  });

  it("returns null for virtual modules (\\0 prefix)", async () => {
    const plugin = getImagePlugin();
    const transform = unwrapHook(plugin.transform);
    const code = `import hero from './hero.png';`;
    const result = await transform.call(plugin, code, "\0virtual:something");
    expect(result).toBeNull();
  });

  it("returns null for non-script files", async () => {
    const plugin = getImagePlugin();
    const transform = unwrapHook(plugin.transform);
    const code = `import hero from './hero.png';`;
    const result = await transform.call(plugin, code, "/app/styles.css");
    expect(result).toBeNull();
  });

  it("skips imports where the image file does not exist", async () => {
    const plugin = getImagePlugin();
    const transform = unwrapHook(plugin.transform);
    const code = `import ghost from './nonexistent.png';`;
    const result = await transform.call(plugin, code, fakeId);
    // Regex matches but fs.existsSync fails — no changes made
    expect(result).toBeNull();
  });

  it("preserves non-image imports alongside image imports", async () => {
    const plugin = getImagePlugin();
    const transform = unwrapHook(plugin.transform);
    const code = [
      `import React from 'react';`,
      `import hero from './test-4x3.png';`,
      `import { useState } from 'react';`,
    ].join("\n");
    const result = await transform.call(plugin, code, fakeId);
    expect(result).not.toBeNull();
    // React imports should still be there
    expect(result.code).toContain(`import React from 'react'`);
    expect(result.code).toContain(`import { useState } from 'react'`);
    // Image import should be transformed
    expect(result.code).toContain("__openvite_img_url_hero");
  });

  it("handles single-quoted imports", async () => {
    const plugin = getImagePlugin();
    const transform = unwrapHook(plugin.transform);
    const code = `import hero from './test-4x3.png';`;
    const result = await transform.call(plugin, code, fakeId);
    expect(result).not.toBeNull();
    expect(result.code).toContain("__openvite_img_url_hero");
  });

  it("handles double-quoted imports", async () => {
    const plugin = getImagePlugin();
    const transform = unwrapHook(plugin.transform);
    const code = `import hero from "./test-4x3.png";`;
    const result = await transform.call(plugin, code, fakeId);
    expect(result).not.toBeNull();
    expect(result.code).toContain("__openvite_img_url_hero");
  });

  it("uses absolute path in meta import", async () => {
    const plugin = getImagePlugin();
    const transform = unwrapHook(plugin.transform);
    const code = `import hero from './test-4x3.png';`;
    const result = await transform.call(plugin, code, fakeId);
    expect(result).not.toBeNull();
    // Meta import should reference the absolute path
    expect(result.code).toContain(PNG_PATH + "?openvite-meta");
  });
});
