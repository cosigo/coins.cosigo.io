export function getAssetBase() {
  return process.env.NEXT_PUBLIC_ASSET_BASE_URL || "https://cdn.cosigo.io";
}

export const ASSET_BASE = getAssetBase();
