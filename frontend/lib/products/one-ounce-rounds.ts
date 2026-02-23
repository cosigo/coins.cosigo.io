import { Product, ASSET_BASE } from "./types"

export const oneOunceRounds: Product[] = [
  {
    id: "test_token",
    slug: "test_token",
    name_en: "1 oz Silver Round",
    name_es: "Moneda de Plata 1 oz",
    category: "one-ounce-rounds",
    price_mxn: 20,
    images: {
      obverse: `${ASSET_BASE}/images/sold/sold_out_trans.png`,
      reverse: `${ASSET_BASE}/images/sold/cosigo_io_infin_trans.png`,
    },
    metal: "vapor",
    weight_g: 0,
    inStock: true,
  },
  {
    id: "round_1oz",
    slug: "1oz-silver-round",
    name_en: "1 oz Silver Round",
    name_es: "Moneda de Plata 1 oz",
    category: "one-ounce-rounds",
    price_mxn: 1,
    images: {
      obverse: `${ASSET_BASE}/images/sold/sold_out_trans.png`,
      reverse: `${ASSET_BASE}/images/sold/cosigo_io_infin_trans.png`,
    },
    metal: "silver",
    weight_g: 31.1035,
    inStock: true,
  },
]
