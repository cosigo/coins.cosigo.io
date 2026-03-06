import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const today = new Date().toISOString().slice(0, 10)

  const urls = [
    'https://coins.cosigo.io/',
    'https://coins.cosigo.io/category/atb-5oz',
    'https://coins.cosigo.io/category/catalog',
    'https://coins.cosigo.io/category/franklin-half',
    'https://coins.cosigo.io/category/morgan-dollars',
    'https://coins.cosigo.io/category/one-ounce-rounds',
    'https://coins.cosigo.io/category/peace-dollars',
    'https://coins.cosigo.io/category/types',
    'https://coins.cosigo.io/category/validate',
    'https://coins.cosigo.io/category/walking-liberty-dollar',
    'https://coins.cosigo.io/category/walking-liberty-half',    
    // add more categories/products here
  ]

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>\n`)
      .join('') +
    `</urlset>\n`

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
