import './globals.css'
import { Inter } from 'next/font/google'
import { WalletConnection } from '@/components/wallet-connection'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black min-h-screen`}>
        <header className="border-b border-zinc-800">
          <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-white text-xl font-bold">Debate AI</h1>
              {/* <div className="bg-zinc-800 rounded-full px-4 py-1 text-sm flex items-center gap-2">
                <span className="text-amber-400">LITE MODE</span>
                <span className="text-zinc-400">ADVANCED MODE</span>
              </div> */}
            </div>
            <div className="flex items-center">
              <WalletConnection />
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="border-t border-zinc-800 py-4 mt-8">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <p className="text-zinc-400">© 2024 DEBATE AI</p>
            <div className="flex gap-4">
              <a href="/privacy" className="text-zinc-400 hover:text-white">PRIVACY POLICY</a>
              <a href="/terms" className="text-zinc-400 hover:text-white">TERMS OF SERVICE</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}

