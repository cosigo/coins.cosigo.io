import { Product, ASSET_BASE } from "./types"

export const walkingLiberty: Product[] = [
  {
    id: "silver-rounds_1oz",
    slug: "1oz-silver-round",
    name_en: "1 oz Walking Liberty Silver Rounds",
    name_es: "Monedas de Plata Libertad 1 oz",
    category: "walking-liberty-dollar",
    price_mxn: 1,
    images: {
      obverse: `${ASSET_BASE}/images/sold/sold_out_trans.png`,
      reverse: `${ASSET_BASE}/images/sold/cosigo_io_infin_trans.png`,
    },
    metal: "silver",
    weight_g: 31.1035,
    stock: 1,
    inStock: true,
  },
]
