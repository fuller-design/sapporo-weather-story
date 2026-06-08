import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import type { WeatherKind } from "@/lib/weather";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"]);
const iconExtensions = new Set([".svg", ".png", ".webp"]);
const weatherKinds: WeatherKind[] = ["sunny", "cloudy", "rainy", "snow"];

async function listFiles(directory: string, allowedExtensions: Set<string>) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => allowedExtensions.has(path.extname(name).toLowerCase()));
  } catch {
    return [];
  }
}

export async function GET() {
  const publicDir = path.join(process.cwd(), "public");
  const backgrounds = Object.fromEntries(
    await Promise.all(
      weatherKinds.map(async (kind) => {
        const files = await listFiles(path.join(publicDir, "backgrounds", kind), imageExtensions);
        return [kind, files.map((file) => `/backgrounds/${kind}/${file}`)];
      })
    )
  );

  const iconFiles = await listFiles(path.join(publicDir, "icons"), iconExtensions);
  const icons = Object.fromEntries(
    weatherKinds.map((kind) => {
      const file = iconFiles.find((name) => path.basename(name, path.extname(name)) === kind);
      return [kind, file ? `/icons/${file}` : null];
    })
  );
  const detailedIconFiles = await listFiles(path.join(publicDir, "icons", "weather"), iconExtensions);
  const detailedIcons = Object.fromEntries(
    detailedIconFiles.map((file) => [path.basename(file, path.extname(file)), `/icons/weather/${file}`])
  );

  return NextResponse.json({ backgrounds, icons, detailedIcons });
}
