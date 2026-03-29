import type { Metadata } from 'next'
import CartClient from './CartClient'

export const metadata: Metadata = {
  title: 'Cart',
}

export default function Page() {
  return <CartClient />
}