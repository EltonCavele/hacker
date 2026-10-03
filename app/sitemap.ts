import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Public, indexable pages only. Add marketing/blog routes here as they appear.
const PUBLIC_PATHS = ["/", "/login", "/terms", "/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();
  return PUBLIC_PATHS.map((path) => ({ url: new URL(path, origin).toString() }));
}
