import { products } from './products'
import type { ProductCategory } from './products/types'

export type CategoryMeta = {
  label: string
  description?: string
  image?: string
}

const CATEGORY_META: Partial<Record<ProductCategory, CategoryMeta>> = {
  'atb-5oz': {
    label: 'America the Beautiful — 5 oz Silver',
    description: 'National Parks series issued 2010–2021.',
    image: 'https://cdn.cosigo.io/images/hero/atb.jpg',
  },
  'morgan-dollars': {
    label: 'Morgan Dollars',
    description: 'Classic U.S. silver dollars struck 1878–1921.',
    image: 'https://cdn.cosigo.io/images/hero/morgan.jpg',
  },
  'peace-dollars': {
    label: 'Peace Dollars',
    description: 'U.S. silver dollars commemorating post-WWI peace.',
    image: 'https://cdn.cosigo.io/images/hero/peace.jpg',
  },
  'walking-liberty-half': {
    label: 'Walking Liberty Half Dollars',
    image: 'https://cdn.cosigo.io/images/hero/walklibhalf.png'
  },
  'walking-liberty-dollar': {
    label: 'Walking Liberty Dollars',
    image: 'https://cdn.cosigo.io/images/hero/walklib.jpg',
  },
  'franklin-half': {
    label: 'Franklin Half Dollars',
  },
  'kennedy-half': {
    label: 'Kennedy Half Dollars',
  },
  'barber-half': {
    label: 'Barber Half Dollars',
  },
  'barber-quarter': {
    label: 'Barber Quarters',
  },
  'barber-dime': {
    label: 'Barber Dimes',
  },
  'mercury-dime': {
    label: 'Mercury Dimes',
  },
  'roosevelt-dime': {
    label: 'Roosevelt Dimes',
  },
  'washington-quarter': {
    label: 'Washington Quarters',
  },
  'standing-liberty-quarter': {
    label: 'Standing Liberty Quarters',
  },
  'capped-bust-half': {
    label: 'Capped Bust Half Dollars',
  },
  'jefferson-nickels': {
    label: 'Jefferson Nickels',
  },
  'one-ounce-rounds': {
    label: 'One Ounce Silver Rounds',
    image: 'https://cdn.cosigo.io/images/hero/rounds.jpg',
  },
  'proof-set': {
    label: 'Proof Sets',
  },
  'lincoln-pennies-cents': {
    label: 'Lincoln Pennies Cents',
  },
  'gold-st-gaudens': {
    label: 'Gold St Gaudens',
  },
}

/**
 * What the UI consumes
 */
export type CategoryInfo = {
  slug: ProductCategory
  label: string
  description?: string
  image?: string
  count: number
}

export function getCategories(): CategoryInfo[] {
  const counts = products.reduce<Record<ProductCategory, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1
    return acc
  }, {} as Record<ProductCategory, number>)

  return (Object.keys(counts) as ProductCategory[]).map(slug => ({
    slug,
    label: CATEGORY_META[slug]?.label ?? slug,
    description: CATEGORY_META[slug]?.description,
    image: CATEGORY_META[slug]?.image,
    count: counts[slug],
  }))
}

export function getCategoryMeta(slug: ProductCategory) {
  return CATEGORY_META[slug]
}
