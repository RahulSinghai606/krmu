import sharp from "sharp";

// Error Level Analysis — re-encode the image at a known JPEG quality and measure the
// per-pixel difference. Authentic regions compress uniformly (low error); spliced/edited
// regions differ (higher error). Returns a 0–100 suspicion score + a heatmap image.
export async function computeELA(input: Buffer): Promise<{ score: number; heatmap: string; width: number; height: number }> {
  const base = sharp(input).flatten({ background: "#ffffff" }).removeAlpha().resize({ width: 900, withoutEnlargement: true });
  const orig = await base.clone().jpeg({ quality: 95 }).toBuffer();
  const recompressed = await sharp(orig).jpeg({ quality: 85 }).toBuffer();

  const a = await sharp(orig).raw().toBuffer({ resolveWithObject: true });
  const b = await sharp(recompressed).raw().toBuffer({ resolveWithObject: true });
  const d1 = a.data, d2 = b.data;
  const info = a.info;
  const n = Math.min(d1.length, d2.length);

  const diff = Buffer.alloc(n);
  const scale = 16;
  let sum = 0;
  let hot = 0; // count of strongly-differing pixels (tamper indicator)
  for (let i = 0; i < n; i++) {
    const v = Math.min(255, Math.abs(d1[i] - d2[i]) * scale);
    diff[i] = v;
    sum += v;
    if (v > 90) hot++;
  }
  const mean = sum / n;                       // 0..255
  const hotRatio = hot / n;                    // fraction of high-error pixels
  // Blend mean error + concentration of hot pixels; localised hot spots are the real signal.
  const score = Math.max(0, Math.min(100, Math.round((mean / 255) * 130 + hotRatio * 320)));

  const heatmapPng = await sharp(diff, { raw: { width: info.width, height: info.height, channels: info.channels as 1 | 2 | 3 | 4 } })
    .normalise().png().toBuffer();

  return { score, heatmap: "data:image/png;base64," + heatmapPng.toString("base64"), width: info.width, height: info.height };
}
