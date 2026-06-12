import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Covet & Mane — AI Marketing Operations OS',
  description: 'AI-powered marketing operations system for Covet & Mane',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>{children}</body>
    </html>
  )
}
