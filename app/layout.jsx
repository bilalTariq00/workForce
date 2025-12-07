import { Inter } from 'next/font/google'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import 'stream-chat-react/dist/css/v2/index.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import QueryProvider from '@/lib/providers/QueryProvider'
import StreamChatProvider from '@/components/providers/StreamChatProvider'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Workforce Management System',
  description: 'HR and Workforce Management Platform',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <SessionProvider>
            <StreamChatProvider>
              {children}
            </StreamChatProvider>
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  )
}

