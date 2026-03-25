import { Product, ASSET_BASE } from "./types"

export const walkinglibertyHalf: Product[] = [
  {
    id: "silver-half-dollars",
    slug: "wl-silver-half-dollars",
    name_en: "Walking Liberty Half Dollars",
    name_es: "Monedas de Plata Libertad Caminando",
    category: "walking-liberty-half",
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
