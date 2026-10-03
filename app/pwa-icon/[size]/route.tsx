import { ImageResponse } from "next/og";

const SIZES: Record<string, { px: number; maskable: boolean }> = {
  "192": { px: 192, maskable: false },
  "512": { px: 512, maskable: false },
  // Maskable icons keep the glyph inside the central safe zone and bleed the background to the edges.
  maskable: { px: 512, maskable: true },
  apple: { px: 180, maskable: true },
};

export async function GET(_request: Request, { params }: RouteContext<"/pwa-icon/[size]">) {
  const { size } = await params;
  const spec = SIZES[size];
  if (!spec) return new Response("Not found", { status: 404 });

  const glyph = spec.px * (spec.maskable ? 0.5 : 0.62);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#ffffff",
          fontSize: glyph,
          fontWeight: 700,
          borderRadius: spec.maskable ? 0 : spec.px * 0.22,
        }}
      >
        N
      </div>
    ),
    { width: spec.px, height: spec.px, headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
  );
}
