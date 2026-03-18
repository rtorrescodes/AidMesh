import type { Metadata } from 'next'
import './globals.css'
import StatusBar from '@/components/StatusBar'

export const metadata: Metadata = {
  title: 'AidMesh — Panel Operativo',
  description: 'Plataforma de coordinación de respuesta crítica',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ paddingBottom: 24, minHeight: '100vh', backgroundColor: '#09090b', color: 'white' }}>
        {children}
        <StatusBar />
      </body>
    </html>
  )
}