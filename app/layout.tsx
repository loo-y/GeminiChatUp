import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'ChatUp',
    description: 'ChatUp',
}

export const viewport = {
    themeColor: 'light',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={` overflow-hidden`}>{children}</body>
        </html>
    )
}
