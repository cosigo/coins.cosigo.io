import { Product, ASSET_BASE } from './types'

export const oneOunceRounds: Product[] = [
  {
    id: '2017-2oz-silver-st-gaudens-BU',
    slug: '2017-2oz-silver-st-gaudens-BU',
    name_en: '2017 2oz silver St Gaudens (BU)',
    name_es: '2017-2oz silver St Gaudens (BU)',
    category: 'one-ounce-rounds',
    price_mxn: 4970,
    images: {
      obverse: `${ASSET_BASE}/images/one-ounce-rounds/2018 Augustus Saint Gaudens 2 oz 39mm 999 Fine Silver High Relief Medal 20 e.jpg`,
      reverse: `${ASSET_BASE}/images/one-ounce-rounds/2018 Augustus Saint Gaudens 2 oz 39mm 999 Fine Silver High Relief Medal 20 f.jpg`,
    },
    metal: "silver",
    weight_g: 62.2070,
    inStock: true,
  },
  {
    id: '2012-1oz-silver-wildlife-cananda-cougar-BU',
    slug: '2012-1oz-silver-wildlife-cananda-cougar-BU',
    name_en: '2012 1oz silver wildlife Cananda Cougar (BU)',
    name_es: '2012 1oz silver wildlife Cananda Cougar (BU)',
    category: 'one-ounce-rounds',
    price_mxn: 2790,
    images: {
      obverse: `${ASSET_BASE}/images/one-ounce-rounds/2012-canada-1-oz-silver-wildlife-series-cougar_64598_Slab.jpg`,
      reverse: `${ASSET_BASE}/images/one-ounce-rounds/2012-canada-1-oz-silver-wildlife-series-cougar_64598_Obv.jpg`,
    },
    metal: "silver",
    weight_g: 31.1035,
    inStock: true,
  },

]
