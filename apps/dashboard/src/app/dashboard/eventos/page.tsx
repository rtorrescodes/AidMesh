'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { eventsAPI } from '@/lib/api'
import { AidMeshEvent, EventStatus, EventType, DeploymentProfile } from '@/types'
import { isAuthenticated } from '@/lib/auth'

const STATUS_COLORS: Record<EventStatus, string> = {
  [EventStatus.PREPARATION]: '#534ab7',
  [EventStatus.ACTIVE]: '#1d9e75',
  [EventStatus.CONTAINED]: '#f5c518',
  [EventStatus.CLOSED]: '#e53935',
  [EventStatus.ARCHIVED]: '#8b8fa8',
}

const STATUS_LABELS: Record<EventStatus, string> = {
  [EventStatus.PREPARATION]: 'Preparación',
  [EventStatus.ACTIVE]: 'Activo',
  [EventStatus.CONTAINED]: 'Contenido',
  [EventStatus.CLOSED]: 'Cerrado',
  [EventStatus.ARCHIVED]: 'Archivo',
}

const TYPE_OPTIONS = [
  { value: EventType.HURRICANE, label: 'Huracán' },
  { value: EventType.EARTHQUAKE, label: 'Sismo' },
  { value: EventType.TSUNAMI, label: 'Tsunami' },
  { value: EventType.FLOOD, label: 'Inundación' },
  { value: EventType.FIRE, label: 'Incendio' },
  { value: EventType.SEARCH_RESCUE, label: 'Búsqueda y Rescate' },
  { value: EventType.PUBLIC_HEALTH, label: 'Salud Pública' },
  { value: EventType.CIVIL_SECURITY, label: 'Seguridad Civil' },
  { value: EventType.HUMANITARIAN, label: 'Humanitario' },
]

const PROFILE_OPTIONS = [
  { value: DeploymentProfile.BASIC, label: 'Básico' },
  { value: DeploymentProfile.SEARCH_RESCUE, label: 'Búsqueda y Rescate' },
  { value: DeploymentProfile.NATURAL_DISASTER, label: 'Desastre Natural' },
  { value: DeploymentProfile.MAJOR_CRISIS, label: 'Crisis Mayor' },
]

const NEXT_STATUS: Partial<Record<EventStatus, EventStatus>> = {
  [EventStatus.PREPARATION]: EventStatus.ACTIVE,
  [EventStatus.ACTIVE]: EventStatus.CONTAINED,
  [EventStatus.CONTAINED]: EventStatus.CLOSED,
  [EventStatus.CLOSED]: EventStatus.ARCHIVED,
}

const NEXT_STATUS_LABELS: Partial<Record<EventStatus, string>> = {
  [EventStatus.PREPARATION]: 'Activar',
  [EventStatus.ACTIVE]: 'Contener',
  [EventStatus.CONTAINED]: 'Cerrar',
  [EventStatus.CLOSED]: 'Archivar',
}

export default function EventosPage() {
  const router = useRouter()
  const [events, setEvents] = useState<AidMeshEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: EventType.HURRICANE,
    deployment_profile: DeploymentProfile.BASIC,
    description: '',
    escalation_timeout_min: 30,
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadEvents()
  }, [])

  async function loadEvents() {
    try {
      const res = await eventsAPI.getAll()
      setEvents(res.data)
    } catch (err) {
      console.error('Error cargando eventos:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!form.name.trim()) return
    setCreating(true)
    try {
      await eventsAPI.create(form)
      setForm({
        name: '',
        type: EventType.HURRICANE,
        deployment_profile: DeploymentProfile.BASIC,
        description: '',
        escalation_timeout_min: 30,
      })
      loadEvents()
    } catch (err) {
      console.error('Error creando evento:', err)
    } finally {
      setCreating(false)
    }
  }

  async function handleTransition(id: string, newStatus: EventStatus) {
    try {
      await eventsAPI.transition(id, newStatus)
      loadEvents()
    } catch (err) {
      console.error('Error cambiando estado:', err)
    }
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>Cargando eventos...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Gestión de Eventos</h1>
          <p style={styles.subtitle}>Crear y administrar eventos del sistema</p>
        </div>
        <button style={styles.backBtn} onClick={() => router.push('/dashboard')}>
          ← Volver al dashboard
        </button>
      </div>

      {/* Crear evento */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Nuevo Evento</h3>
        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Nombre del evento *</label>
            <input
              style={styles.input}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Huracán Norma 2025"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Tipo de amenaza</label>
            <select
              style={styles.input}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as EventType })}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Perfil de despliegue</label>
            <select
              style={styles.input}
              value={form.deployment_profile}
              onChange={(e) => setForm({ ...form, deployment_profile: e.target.value as DeploymentProfile })}
            >
              {PROFILE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Timeout escalación (min)</label>
            <input
              style={styles.input}
              type="number"
              value={form.escalation_timeout_min}
              onChange={(e) => setForm({ ...form, escalation_timeout_min: Number(e.target.value) })}
            />
          </div>

          <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
            <label style={styles.label}>Descripción</label>
            <input
              style={styles.input}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descripción del evento (opcional)"
            />
          </div>
        </div>

        <button
          style={{ ...styles.createBtn, opacity: creating ? 0.7 : 1 }}
          onClick={handleCreate}
          disabled={creating || !form.name.trim()}
        >
          {creating ? 'Creando...' : '+ Crear Evento'}
        </button>
      </div>

      {/* Lista de eventos */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          Todos los eventos
          <span style={styles.count}>{events.length}</span>
        </h3>

        {events.length === 0 ? (
          <p style={styles.empty}>Sin eventos creados</p>
        ) : (
          <div style={styles.eventList}>
            {events.map((event) => (
              <div key={event.id} style={styles.eventItem}>
                <div style={styles.eventLeft}>
                  <div
                    style={{
                      ...styles.statusDot,
                      background: STATUS_COLORS[event.status],
                    }}
                  />
                  <div>
                    <p style={styles.eventName}>{event.name}</p>
                    <p style={styles.eventMeta}>
                      {event.type} · {event.deployment_profile} · timeout: {event.escalation_timeout_min} min
                    </p>
                    {event.description && (
                      <p style={styles.eventDesc}>{event.description}</p>
                    )}
                  </div>
                </div>

                <div style={styles.eventRight}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      background: STATUS_COLORS[event.status] + '22',
                      color: STATUS_COLORS[event.status],
                      border: `1px solid ${STATUS_COLORS[event.status]}44`,
                    }}
                  >
                    {STATUS_LABELS[event.status]}
                  </span>

                  {NEXT_STATUS[event.status] && (
                    <button
                      style={styles.transitionBtn}
                      onClick={() => handleTransition(event.id, NEXT_STATUS[event.status]!)}
                    >
                      {NEXT_STATUS_LABELS[event.status]}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px', background: '#0f1117', minHeight: '100vh' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#8b8fa8' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title: { fontSize: '20px', fontWeight: '700', color: '#e8e8e8', marginBottom: '4px' },
  subtitle: { fontSize: '12px', color: '#8b8fa8' },
  backBtn: { padding: '8px 14px', background: 'transparent', border: '1px solid #2a2d3e', borderRadius: '6px', color: '#8b8fa8', fontSize: '12px', cursor: 'pointer' },
  card: { background: '#1a1d26', border: '1px solid #2a2d3e', borderRadius: '8px', padding: '20px', marginBottom: '16px' },
  cardTitle: { fontSize: '13px', fontWeight: '600', color: '#e8e8e8', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
  count: { background: '#2a2d3e', color: '#8b8fa8', fontSize: '11px', padding: '2px 7px', borderRadius: '10px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '11px', color: '#8b8fa8', fontWeight: '500' },
  input: { background: '#0f1117', border: '1px solid #2a2d3e', borderRadius: '6px', padding: '8px 12px', color: '#e8e8e8', fontSize: '13px' },
  createBtn: { padding: '10px 20px', background: '#534ab7', color: '#fff', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  empty: { fontSize: '12px', color: '#8b8fa8', fontStyle: 'italic' },
  eventList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  eventItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#0f1117', border: '1px solid #2a2d3e', borderRadius: '6px' },
  eventLeft: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', marginTop: '4px', flexShrink: 0 },
  eventName: { fontSize: '13px', fontWeight: '600', color: '#e8e8e8', marginBottom: '2px' },
  eventMeta: { fontSize: '11px', color: '#8b8fa8' },
  eventDesc: { fontSize: '11px', color: '#8b8fa8', marginTop: '2px' },
  eventRight: { display: 'flex', alignItems: 'center', gap: '8px' },
  statusBadge: { fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '10px' },
  transitionBtn: { padding: '6px 12px', background: '#22263a', border: '1px solid #2a2d3e', borderRadius: '6px', color: '#534ab7', fontSize: '11px', fontWeight: '600', cursor: 'pointer' },
}