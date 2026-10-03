import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { SITE_NAME } from "@/lib/site";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const t = await getTranslations("meta");
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 24,
        padding: 96,
        background: "#0a0a0a",
        color: "#ffffff",
      }}
    >
      <div style={{ fontSize: 96, fontWeight: 700 }}>{SITE_NAME}</div>
      <div style={{ fontSize: 40, color: "#a3a3a3" }}>{t("description")}</div>
    </div>,
    size,
  );
}
