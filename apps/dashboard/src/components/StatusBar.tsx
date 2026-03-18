'use client'

import { useEffect, useState } from 'react'

type ServiceStatus = 'ok' | 'error' | 'unknown'
interface ServiceHealth { name: string; status: ServiceStatus }
interface StatusData {
  mqttConnected: boolean
  activeUsers: number
  openTickets: number
  lastActivity: string | null
  services: ServiceHealth[]
}

const defaultStatus: StatusData = {
  mqttConnected: false,
  activeUsers: 0,
  openTickets: 0,
  lastActivity: null,
  services: [
    { name: 'API',    status: 'unknown' },
    { name: 'COM',    status: 'unknown' },
    { name: 'Auth',   status: 'unknown' },
    { name: 'Maps',   status: 'unknown' },
    { name: 'Alerts', status: 'unknown' },
  ],
}

export default function StatusBar() {
  const [status, setStatus] = useState<StatusData>(defaultStatus)
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const endpoints = [
      { name: 'API',    url: `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/health` },
      { name: 'COM',    url: `${process.env.NEXT_PUBLIC_COM_SERVICE_URL}/health` },
      { name: 'Auth',   url: `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/health` },
      { name: 'Maps',   url: `${process.env.NEXT_PUBLIC_MAPS_SERVICE_URL}/health` },
      { name: 'Alerts', url: `${process.env.NEXT_PUBLIC_ALERTS_SERVICE_URL}/health` },
    ]
    const checkHealth = async () => {
      const results = await Promise.allSettled(
        endpoints.map(async (e) => { const res = await fetch(e.url, { signal: AbortSignal.timeout(3000) }); return { name: e.name, ok: res.ok } })
      )
      const services: ServiceHealth[] = results.map((r, i) => ({ name: endpoints[i].name, status: r.status === 'fulfilled' && r.value.ok ? 'ok' : 'error' as ServiceStatus }))
      setStatus(prev => ({ ...prev, services }))
    }
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const hasError = status.services.some(s => s.status === 'error')

  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, height:24, backgroundColor:'#18181b', borderTop:'1px solid #3f3f46', display:'flex', flexDirection:'row', alignItems:'center', fontFamily:'ui-monospace,monospace', fontSize:11, color:'#d4d4d8', zIndex:9999, userSelect:'none', overflow:'hidden', whiteSpace:'nowrap' }}>

      <div style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:5, height:'100%', paddingLeft:10, paddingRight:10, backgroundColor: status.mqttConnected ? '#1d4ed8' : '#3f3f46', color: status.mqttConnected ? '#fff' : '#a1a1aa', flexShrink:0 }}>
        <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', backgroundColor: status.mqttConnected ? '#4ade80' : '#71717a' }} />
        <span>MQTT {status.mqttConnected ? 'conectado' : 'desconectado'}</span>
      </div>

      <span style={{ color:'#52525b', paddingLeft:8, paddingRight:8 }}>|</span>

      <span style={{ color:'#a1a1aa', flexShrink:0 }}>👤 {status.activeUsers} activos</span>

      <span style={{ color:'#52525b', paddingLeft:8, paddingRight:8 }}>|</span>

      <span style={{ color:'#a1a1aa', flexShrink:0 }}>🎫 {status.openTickets} tickets abiertos</span>

      <span style={{ color:'#52525b', paddingLeft:8, paddingRight:8 }}>|</span>

      <div style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:8, flexShrink:0 }}>
        {status.services.map(s => (
          <div key={s.name} style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:4 }} title={`${s.name}: ${s.status}`}>
            <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', backgroundColor: s.status === 'ok' ? '#4ade80' : s.status === 'error' ? '#f87171' : '#52525b' }} />
            <span style={{ color:'#71717a' }}>{s.name}</span>
          </div>
        ))}
      </div>

      <span style={{ color:'#52525b', paddingLeft:8, paddingRight:8 }}>|</span>

      <span style={{ color: hasError ? '#f87171' : '#4ade80', flexShrink:0 }}>{hasError ? '⚠ error en servicios' : '✓ servicios ok'}</span>

      <div style={{ flex:1 }} />

      <span style={{ color:'#71717a', paddingRight:12, flexShrink:0 }}>{currentTime}</span>
    </div>
  )
}
