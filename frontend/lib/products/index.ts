import type { Product } from "./types"
import { atb5oz } from "./atb-5oz"
import { oneOunceRounds } from "./one-ounce-rounds"
import { morganDollars } from "./morgan-dollars"
import { peaceDollars } from "./peace-dollars"
import { walkingLiberty } from "./walking-liberty-dollar"
import { walkinglibertyHalf } from "./walking-liberty-half"
import { franklinHalf } from "./franklin-half"

export const metadata = {
  title: 'Silver Coin Variety and Selection'
}

import { validateProducts } from "./validate"

const merged: Product[] = [
  ...atb5oz,
  ...oneOunceRounds,
  ...morganDollars,
  ...peaceDollars,
  ...walkingLiberty,
  ...walkinglibertyHalf,
  ...franklinHalf
]

const { errors } = validateProducts(merged)

if (errors.length > 0) {
  console.error("❌ Product validation errors:")
  errors.forEach(e => console.error(e))
}

export const products = merged
