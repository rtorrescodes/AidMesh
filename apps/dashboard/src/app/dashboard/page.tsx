'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, isAuthenticated } from '@/lib/auth'
import { eventsAPI, alertsAPI, ticketsAPI } from '@/lib/api'
import { subscribeToEvent } from '@/lib/mqtt'
import { AidMeshEvent, Alert, COMTicket, AlertSeverity, TicketPriority } from '@/types'
import AlertList from '@/components/alerts/AlertList'
import TicketBoard from '@/components/tickets/TicketBoard'
import EventMap from '@/components/map/EventMap'

export default function DashboardPage() {
  const router = useRouter()
  const user = getUser()
  const [events, setEvents] = useState<AidMeshEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<AidMeshEvent | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [tickets, setTickets] = useState<COMTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [mqttMessages, setMqttMessages] = useState<any[]>([])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadEvents()
  }, [])

  useEffect(() => {
    if (!selectedEvent) return
    loadEventData(selectedEvent.id)

    const unsubscribe = subscribeToEvent(selectedEvent.id, (topic, payload) => {
      setMqttMessages((prev) => [
        { topic, payload, ts: new Date().toISOString() },
        ...prev.slice(0, 19),
      ])

      if (
        topic === 'alerts/new' ||
        topic === 'alerts/resolved' ||
        topic === 'com/broadcast/alert'
      ) {
        loadEventData(selectedEvent.id)
      }

      if (
        topic === 'com/tickets/new' ||
        topic === 'citizen/signal/raw' ||
        (topic.startsWith('com/tickets/') && topic.endsWith('/update'))
      ) {
        loadEventData(selectedEvent.id)
      }
    })

    return unsubscribe
  }, [selectedEvent])

  async function loadEvents() {
    try {
      const res = await eventsAPI.getActive()
      setEvents(res.data)
      if (res.data.length > 0) setSelectedEvent(res.data[0])
    } catch (err) {
      console.error('Error cargando eventos:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadEventData(eventId: string) {
    try {
      const [alertsRes, ticketsRes] = await Promise.all([
        alertsAPI.getActive(eventId),
        ticketsAPI.getByEvent(eventId),
      ])
      setAlerts(alertsRes.data)
      setTickets(ticketsRes.data)
    } catch (err) {
      console.error('Error cargando datos del evento:', err)
    }
  }

  const criticalTickets = tickets.filter((t) => t.priority === TicketPriority.CRITICAL)
  const openTickets = tickets.filter((t) => t.status === 'abierto')
  const redAlerts = alerts.filter((a) => a.severity === AlertSeverity.RED)

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>Cargando AidMesh...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={styles.sidebarLogo}>⬡ AidMesh</span>
          <span style={styles.sidebarUser}>{user?.name}</span>
        </div>

        <div style={styles.sidebarSection}>
          <p style={styles.sidebarLabel}>Eventos activos</p>
          {events.length === 0 ? (
            <p style={styles.sidebarEmpty}>Sin eventos activos</p>
          ) : (
            events.map((event) => (
              <button
                key={event.id}
                style={{
                  ...styles.eventBtn,
                  background: selectedEvent?.id === event.id ? '#22263a' : 'transparent',
                  borderColor: selectedEvent?.id === event.id ? '#534ab7' : 'transparent',
                }}
                onClick={() => setSelectedEvent(event)}
              >
                <span style={styles.eventBtnName}>{event.name}</span>
                <span style={styles.eventBtnType}>{event.type}</span>
              </button>
            ))
          )}
        </div>

        <div style={styles.sidebarBottom}>
          <button
            style={styles.logoutBtn}
            onClick={() => {
              localStorage.clear()
              router.push('/login')
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={styles.main}>
        {!selectedEvent ? (
          <div style={styles.empty}>
            <p>Selecciona un evento para comenzar</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={styles.header}>
              <div>
                <h1 style={styles.headerTitle}>{selectedEvent.name}</h1>
                <p style={styles.headerSub}>
                  {selectedEvent.type} · {selectedEvent.deployment_profile} · {selectedEvent.status}
                </p>
              </div>
              <div style={styles.headerActions}>
                <button
                  style={styles.actionBtn}
                  onClick={() => router.push('/dashboard/eventos')}
                >
                  Gestionar eventos
                </button>
              </div>
            </div>

            {/* KPIs */}
            <div style={styles.kpis}>
              <div style={styles.kpiCard}>
                <span style={styles.kpiNum}>{alerts.length}</span>
                <span style={styles.kpiLabel}>Alertas activas</span>
              </div>
              <div style={{ ...styles.kpiCard, borderColor: redAlerts.length > 0 ? '#e53935' : '#2a2d3e' }}>
                <span style={{ ...styles.kpiNum, color: redAlerts.length > 0 ? '#e53935' : '#e8e8e8' }}>
                  {redAlerts.length}
                </span>
                <span style={styles.kpiLabel}>Alertas rojas</span>
              </div>
              <div style={styles.kpiCard}>
                <span style={styles.kpiNum}>{openTickets.length}</span>
                <span style={styles.kpiLabel}>Tickets abiertos</span>
              </div>
              <div style={{ ...styles.kpiCard, borderColor: criticalTickets.length > 0 ? '#e53935' : '#2a2d3e' }}>
                <span style={{ ...styles.kpiNum, color: criticalTickets.length > 0 ? '#e53935' : '#e8e8e8' }}>
                  {criticalTickets.length}
                </span>
                <span style={styles.kpiLabel}>Tickets críticos</span>
              </div>
            </div>

            {/* Content grid */}
            <div style={styles.grid}>
              <div style={styles.gridLeft}>
                <EventMap alerts={alerts} eventName={selectedEvent.name} />
                <AlertList
                  alerts={alerts}
                  onResolve={() => loadEventData(selectedEvent.id)}
                />
                <TicketBoard
                  tickets={tickets}
                  onUpdate={() => loadEventData(selectedEvent.id)}
                />
              </div>

              {/* MQTT feed */}
              <div style={styles.gridRight}>
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>Feed MQTT en tiempo real</h3>
                  {mqttMessages.length === 0 ? (
                    <p style={styles.emptyText}>Esperando mensajes...</p>
                  ) : (
                    <div style={styles.mqttList}>
                      {mqttMessages.map((msg, i) => (
                        <div key={i} style={styles.mqttItem}>
                          <span style={styles.mqttTopic}>{msg.topic}</span>
                          <span style={styles.mqttTs}>
                            {new Date(msg.ts).toLocaleTimeString()}
                          </span>
                          <pre style={styles.mqttPayload}>
                            {JSON.stringify(msg.payload, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', height: '100vh', overflow: 'hidden', background: '#0f1117' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#8b8fa8' },
  sidebar: { width: '240px', background: '#1a1d26', borderRight: '1px solid #2a2d3e', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sidebarHeader: { padding: '20px 16px', borderBottom: '1px solid #2a2d3e' },
  sidebarLogo: { display: 'block', fontSize: '16px', fontWeight: '700', color: '#534ab7', marginBottom: '4px' },
  sidebarUser: { fontSize: '12px', color: '#8b8fa8' },
  sidebarSection: { padding: '16px', flex: 1, overflowY: 'auto' },
  sidebarLabel: { fontSize: '10px', color: '#8b8fa8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '8px' },
  sidebarEmpty: { fontSize: '12px', color: '#8b8fa8', fontStyle: 'italic' },
  eventBtn: { width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: '6px', border: '1px solid', marginBottom: '4px', background: 'transparent', cursor: 'pointer' },
  eventBtnName: { display: 'block', fontSize: '12px', color: '#e8e8e8', fontWeight: '600' },
  eventBtnType: { display: 'block', fontSize: '10px', color: '#8b8fa8', marginTop: '2px' },
  sidebarBottom: { padding: '16px', borderTop: '1px solid #2a2d3e' },
  logoutBtn: { width: '100%', padding: '8px', background: 'transparent', border: '1px solid #2a2d3e', borderRadius: '6px', color: '#8b8fa8', fontSize: '12px', cursor: 'pointer' },
  main: { flex: 1, overflowY: 'auto', padding: '24px' },
  empty: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8b8fa8' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  headerTitle: { fontSize: '20px', fontWeight: '700', color: '#e8e8e8', marginBottom: '4px' },
  headerSub: { fontSize: '12px', color: '#8b8fa8' },
  headerActions: { display: 'flex', gap: '8px' },
  actionBtn: { padding: '8px 14px', background: '#534ab7', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  kpis: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' },
  kpiCard: { background: '#1a1d26', border: '1px solid #2a2d3e', borderRadius: '8px', padding: '16px', textAlign: 'center' },
  kpiNum: { display: 'block', fontSize: '28px', fontWeight: '700', color: '#e8e8e8' },
  kpiLabel: { display: 'block', fontSize: '11px', color: '#8b8fa8', marginTop: '4px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' },
  gridLeft: { display: 'flex', flexDirection: 'column', gap: '16px' },
  gridRight: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: { background: '#1a1d26', border: '1px solid #2a2d3e', borderRadius: '8px', padding: '16px' },
  cardTitle: { fontSize: '13px', fontWeight: '600', color: '#e8e8e8', marginBottom: '12px' },
  emptyText: { fontSize: '12px', color: '#8b8fa8', fontStyle: 'italic' },
  mqttList: { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' },
  mqttItem: { background: '#0f1117', borderRadius: '6px', padding: '8px 10px', border: '1px solid #2a2d3e' },
  mqttTopic: { display: 'block', fontSize: '10px', color: '#534ab7', fontWeight: '700', fontFamily: 'monospace' },
  mqttTs: { display: 'block', fontSize: '10px', color: '#8b8fa8', marginBottom: '4px' },
  mqttPayload: { fontSize: '10px', color: '#8b8fa8', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '80px', overflow: 'hidden' },
}