import type { Metadata } from 'next'
import { Space_Grotesk, Geist, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { HarborShell } from '@/components/harbor/HarborShell'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-ibm-plex-mono',
})

export const metadata: Metadata = {
  title: 'Claim Harbor — GEN-Backed Cover & Claim Settlement',
  description:
    'Claim Harbor is a GenLayer-native insurance protocol. Buy cover in GEN, submit evidence of loss, and let GenLayer validators judge your claim. Payouts are trustless and on-chain.',
  keywords: ['GenLayer', 'insurance', 'cover', 'claim', 'GEN', 'DeFi', 'on-chain', 'StudioNet'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${geist.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-screen antialiased" style={{ background: 'var(--deep-harbor)', color: 'var(--fog-white)' }}>
        <HarborShell>{children}</HarborShell>
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  )
}
