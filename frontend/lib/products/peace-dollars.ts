import type { Product } from './types'
import { ASSET_BASE } from './types'

export const metadata = {
  title: 'Peace Dollar Silver Coins 1921 to 1934 BU AU XF Condition'
}

export const peaceDollars: Product[] = [
  {
    id: 'peace-1921-p-high-relief-au',
    slug: 'peace-1921-p-high-relief-au',
    name_en: 'Peace Dollar — 1921 P High Relief (AU)',
    name_es: 'Peace Dollar — 1921 P High Relief (AU)',
    category: 'peace-dollars',
    price_mxn: 6450,
    images: {
      obverse: `${ASSET_BASE}/images/peace-dollars/1921/1921_peace_hi_relief_au_toned_ba2_obv.jpg`,
      reverse: `${ASSET_BASE}/images/peace-dollars/1921/1921_peace_hi_relief_au_toned_ba2_rev.jpg`,
    },
    metal: 'silver',
    weight_g: 26.73,
    stock: 1,
    inStock: true,
  },
  {
    id: 'peace-1921-p-high-relief-vf',
    slug: 'peace-1921-p-high-relief-vf',
    name_en: 'Peace Dollar — 1921 P High Relief (VF)',
    name_es: 'Peace Dollar — 1921 P High Relief (VF)',
    category: 'peace-dollars',
    price_mxn: 3150,
    images: {
      obverse: `${ASSET_BASE}/images/peace-dollars/1921/peace_1921_highrel_vf_obv.jpg`,
      reverse: `${ASSET_BASE}/images/peace-dollars/1921/peace_1921_highrel_vf_rev.jpg`,
    },
    metal: 'silver',
    weight_g: 26.73,
    stock: 1,
    inStock: true,
  },
  {
    id: 'peace-dollar-1922-p-au',
    slug: 'peace-dollar-1922-p-au',
    name_en: 'Peace Dollar — 1922 P (AU)',
    name_es: 'Peace Dollar — 1922 P (AU)',
    category: 'peace-dollars',
    price_mxn: 2450,
    images: {
      obverse: `${ASSET_BASE}/images/peace-dollars/1922/peace_1922_p_ms+_frosty_bbb_obv.jpg`,
      reverse: `${ASSET_BASE}/images/peace-dollars/1922/peace_1922_p_ms+_frosty_bbb_rev.jpg`,
    },
    metal: 'silver',
    weight_g: 26.73,
    stock: 2,
    inStock: true,
  },
  {
    id: 'peace-dollar-1922-p-bu',
    slug: 'peace-dollar-1922-p-bu',
    name_en: 'Peace Dollar — 1922 P (BU)',
    name_es: 'Peace Dollar — 1922 P (BU)',
    category: 'peace-dollars',
    price_mxn: 2750,
    images: {
      obverse: `${ASSET_BASE}/images/peace-dollars/1922/peace_1922_p_ms+_frosty_bbd_obv.jpg`,
      reverse: `${ASSET_BASE}/images/peace-dollars/1922/peace_1922_p_ms+_frosty_bbd_rev.jpg`,
    },
    metal: 'silver',
    weight_g: 26.73,
    stock: 2,
    inStock: true,
  },
]
