import './globals.css'
import Header from '../components/layout/Header'

export const metadata = {
  title: {
    default: 'COSIGO Coins | Silver Anchored Coins, Exchange, and Reference',
    template: '%s | COSIGO Coins',
  },

  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' }
    ],
    other: [
      { rel: 'icon', url: '/favicon-192x192.png', sizes: '192x192' }
    ]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  )
}
