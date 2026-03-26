import { NextResponse } from 'next/server'
import { getAvailableStockForSlug } from '@/lib/inventory'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const slug = (url.searchParams.get('slug') || '').trim()

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  }

  try {
    const available = await getAvailableStockForSlug(slug)
    return NextResponse.json({ slug, available })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    )
  }
}