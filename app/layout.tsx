import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'
import type { Viewport } from 'next'

export const metadata: Metadata = {
    title: 'ChatUp',
    description: 'ChatUp',
    appleWebApp: true,
}

export const viewport: Viewport = {
    themeColor: 'light',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    minimumScale: 1,
    userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={` overflow-hidden`}>
                {children}
                <Analytics />
            </body>
        </html>
    )
}
