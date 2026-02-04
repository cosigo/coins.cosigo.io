import { ASSET_BASE } from "../../config/assets"

export type ProductCategory =
  | 'morgan-dollars'
  | 'peace-dollars'
  | 'walking-liberty-half'
  | 'franklin-half'
  | 'washington-quarter'
  | 'standing-liberty-quarter'
  | 'walking-liberty-dollar'
  | 'one-ounce-rounds'
  | 'atb-5oz'
  | 'capped-bust-half'
  | 'mercury-dime'
  | 'proof-set'
  | 'barber-dime'
  | 'roosevelt-dime'
  | 'barber-half'
  | 'kennedy-half'
  | 'barber-quarter'
  | 'jefferson-nickels'
  | 'lincoln-pennies-cents'
  | 'gold-st-gaudens'

export interface Product {
  id: string
  slug: string
  name_en: string
  name_es: string
  category: ProductCategory
  price_mxn: number
  images: {
    obverse: string
    reverse: string
  }
  metal: string
  weight_g: number
  inStock: boolean
}

export { ASSET_BASE }
