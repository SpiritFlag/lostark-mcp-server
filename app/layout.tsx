import type { ReactNode } from 'react'

export const metadata = { title: 'lostark-mcp-server' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
