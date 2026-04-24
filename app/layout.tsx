import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import clsx from 'clsx'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SAV du Cinéma',
  description: 'Laissez votre avis vocal sur le film du moment.',
  manifest: '/manifest.json',
  icons: {
    apple: '/sav-logo-v2.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className={clsx(inter.className, "bg-black text-white antialiased selection:bg-indigo-500/30")}>
        {children}
        <Toaster theme="dark" position="bottom-center" />
      </body>
    </html>
  )
}
