import { ThemeProvider } from 'next-themes'
import './globals.css'

export const metadata = {
  title: 'Urban Planning Dashboard',
  description: 'A modern urban planning dashboard with city insights, future vision, and benchmarking',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}