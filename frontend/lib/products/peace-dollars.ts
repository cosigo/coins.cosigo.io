import type { Product } from './types'
import { ASSET_BASE } from './types'

export const peaceDollars: Product[] = [
  {
    id: 'peace-1922-p-1',
    slug: 'peace-1922-p-ms60',
    name_en: 'Peace Dollar — 1922-P (MS60)',
    name_es: 'Dólar Paz — 1922-P (MS60)',
    category: 'peace-dollars',
    price_mxn: 0,
    images: {
      obverse: `${ASSET_BASE}/images/sold/sold_out_trans.png`,
      reverse: `${ASSET_BASE}/images/sold/cosigo_io_infin_trans.png`,
    },
    metal: 'silver',
    weight_g: 26.73,
    inStock: true,
  },
]
