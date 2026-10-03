/**
 * Dev-only demo asset for the BlurImage demo: serves a generated image after a delay, so the blur-to-sharp transition is
 * visible without depending on the network. `?delay=1500&hue=220`. Like the design-system page, it is absent in production.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 })

  const { searchParams } = new URL(request.url)
  const delay = Math.min(Math.max(Number(searchParams.get("delay") ?? 1200), 0), 5000)
  const hue = Number(searchParams.get("hue") ?? 220) % 360

  await new Promise((resolve) => setTimeout(resolve, delay))

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 80% 62%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 90% 84%)"/>
    </linearGradient>
    <linearGradient id="far" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="hsl(${(hue + 20) % 360} 45% 45%)"/><stop offset="1" stop-color="hsl(${(hue + 20) % 360} 50% 30%)"/>
    </linearGradient>
    <linearGradient id="near" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="hsl(${(hue + 60) % 360} 40% 26%)"/><stop offset="1" stop-color="hsl(${(hue + 60) % 360} 45% 14%)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#sky)"/>
  <circle cx="610" cy="130" r="58" fill="hsl(${(hue + 160) % 360} 100% 92%)" opacity="0.95"/>
  <circle cx="610" cy="130" r="92" fill="hsl(${(hue + 160) % 360} 100% 92%)" opacity="0.25"/>
  <path d="M0 330 L130 210 L240 300 L360 170 L500 310 L620 220 L800 340 V500 H0 Z" fill="url(#far)"/>
  <path d="M0 400 L100 330 L210 395 L330 320 L450 405 L590 335 L700 400 L800 360 V500 H0 Z" fill="url(#near)"/>
  <g fill="hsl(${hue} 30% 12%)">
    <path d="M90 470 l14-62 14 62z"/><path d="M130 470 l10-46 10 46z"/><path d="M680 470 l14-66 14 66z"/><path d="M720 470 l10-50 10 50z"/>
  </g>
</svg>`

  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" },
  })
}
