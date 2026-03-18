'use client'

import { useState } from 'react'
import { ticketsAPI } from '@/lib/api'
import { NeedType, TicketPriority } from '@/types'

interface Props {
  eventId: string
  onCreated: () => void
}

const NEED_OPTIONS = [
  { value: NeedType.FOOD, label: '🍽 Alimento' },
  { value: NeedType.WATER, label: '💧 Agua' },
  { value: NeedType.MEDICAL, label: '🏥 Médico' },
  { value: NeedType.SHELTER, label: '🏠 Albergue' },
  { value: NeedType.RESCUE, label: '🚨 Rescate' },
  { value: NeedType.TRANSPORT, label: '🚗 Transporte' },
  { value: NeedType.SUPPLIES, label: '📦 Suministros' },
  { value: NeedType.SECURITY, label: '🛡 Seguridad' },
]

const RESOURCE_OPTIONS: Record<string, string[]> = {
  [NeedType.FOOD]: ['Víveres', 'Agua potable', 'Fórmula infantil', 'Comida preparada'],
  [NeedType.WATER]: ['Agua embotellada', 'Purificadores', 'Pipas de agua'],
  [NeedType.MEDICAL]: ['Medicamentos', 'Personal médico', 'Ambulancia', 'Equipo médico'],
  [NeedType.SHELTER]: ['Albergue', 'Carpas', 'Cobijas', 'Colchonetas'],
  [NeedType.RESCUE]: ['Equipo de rescate', 'Perros rastreadores', 'Helicóptero', 'Lancha'],
  [NeedType.TRANSPORT]: ['Vehículo', 'Autobús', 'Helicóptero', 'Lancha'],
  [NeedType.SUPPLIES]: ['Ropa', 'Calzado', 'Herramientas', 'Generador'],
  [NeedType.SECURITY]: ['Personal de seguridad', 'Patrulla', 'Iluminación'],
}

const PRIORITY_OPTIONS = [
  { value: TicketPriority.LOW, label: 'Baja', color: '#1d9e75' },
  { value: TicketPriority.MEDIUM, label: 'Media', color: '#f5c518' },
  { value: TicketPriority.HIGH, label: 'Alta', color: '#f07d18' },
  { value: TicketPriority.CRITICAL, label: '🚨 Crítica', color: '#e53935' },
]

const QUANTITY_OPTIONS = ['1', '2', '5', '10', '20', '50', '100', 'Indefinido']

// Ubicaciones predefinidas de BCS
const LOCATION_OPTIONS = [
  { label: 'La Paz — Centro', lat: 24.1426, lng: -110.3128 },
  { label: 'Los Cabos — San José', lat: 23.0634, lng: -109.6917 },
  { label: 'Los Cabos — Cabo San Lucas', lat: 22.8905, lng: -109.9167 },
  { label: 'Ciudad Constitución', lat: 25.0333, lng: -111.6667 },
  { label: 'Loreto', lat: 26.0125, lng: -111.3428 },
  { label: 'Mulegé', lat: 26.8833, lng: -111.9833 },
  { label: 'Santa Rosalía', lat: 27.3333, lng: -112.2667 },
  { label: 'Guerrero Negro', lat: 27.9667, lng: -114.0500 },
]

export default function CreateTicket({ eventId, onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    need_type: NeedType.FOOD,
    resource_category: RESOURCE_OPTIONS[NeedType.FOOD][0],
    priority: TicketPriority.MEDIUM,
    quantity: '1',
    location_index: 0,
    description: '',
  })

  const resources = RESOURCE_OPTIONS[form.need_type] || []

  async function handleCreate() {
    setLoading(true)
    try {
      const location = LOCATION_OPTIONS[form.location_index]
      await ticketsAPI.create({
        event_id: eventId,
        need_type: form.need_type,
        resource_category: form.resource_category,
        priority: form.priority,
        quantity: form.quantity === 'Indefinido' ? undefined : Number(form.quantity),
        latitude: location.lat,
        longitude: location.lng,
        description: form.description || undefined,
      })
      setOpen(false)
      setForm({
        need_type: NeedType.FOOD,
        resource_category: RESOURCE_OPTIONS[NeedType.FOOD][0],
        priority: TicketPriority.MEDIUM,
        quantity: '1',
        location_index: 0,
        description: '',
      })
      onCreated()
    } catch (err) {
      console.error('Error creando ticket:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleNeedChange(need: NeedType) {
    setForm({
      ...form,
      need_type: need,
      resource_category: RESOURCE_OPTIONS[need][0],
    })
  }

  if (!open) {
    return (
      <button style={styles.openBtn} onClick={() => setOpen(true)}>
        + Nuevo ticket COM
      </button>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Nuevo ticket COM</h3>
        <button style={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
      </div>

      <div style={styles.form}>
        {/* Tipo de necesidad */}
        <div style={styles.field}>
          <label style={styles.label}>Tipo de necesidad</label>
          <div style={styles.grid2}>
            {NEED_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                style={{
                  ...styles.optBtn,
                  background: form.need_type === opt.value ? '#534ab7' : '#0f1117',
                  borderColor: form.need_type === opt.value ? '#534ab7' : '#2a2d3e',
                  color: form.need_type === opt.value ? '#fff' : '#8b8fa8',
                }}
                onClick={() => handleNeedChange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categoría de recurso */}
        <div style={styles.field}>
          <label style={styles.label}>Recurso específico</label>
          <div style={styles.grid2}>
            {resources.map((r) => (
              <button
                key={r}
                style={{
                  ...styles.optBtn,
                  background: form.resource_category === r ? '#22263a' : '#0f1117',
                  borderColor: form.resource_category === r ? '#534ab7' : '#2a2d3e',
                  color: form.resource_category === r ? '#e8e8e8' : '#8b8fa8',
                }}
                onClick={() => setForm({ ...form, resource_category: r })}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Prioridad */}
        <div style={styles.field}>
          <label style={styles.label}>Prioridad</label>
          <div style={styles.grid4}>
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                style={{
                  ...styles.optBtn,
                  background: form.priority === opt.value ? opt.color + '22' : '#0f1117',
                  borderColor: form.priority === opt.value ? opt.color : '#2a2d3e',
                  color: form.priority === opt.value ? opt.color : '#8b8fa8',
                  fontWeight: form.priority === opt.value ? '700' : '400',
                }}
                onClick={() => setForm({ ...form, priority: opt.value })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cantidad */}
        <div style={styles.field}>
          <label style={styles.label}>Cantidad</label>
          <div style={styles.grid4}>
            {QUANTITY_OPTIONS.map((q) => (
              <button
                key={q}
                style={{
                  ...styles.optBtn,
                  background: form.quantity === q ? '#22263a' : '#0f1117',
                  borderColor: form.quantity === q ? '#534ab7' : '#2a2d3e',
                  color: form.quantity === q ? '#e8e8e8' : '#8b8fa8',
                }}
                onClick={() => setForm({ ...form, quantity: q })}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Ubicación */}
        <div style={styles.field}>
          <label style={styles.label}>Ubicación</label>
          <select
            style={styles.select}
            value={form.location_index}
            onChange={(e) => setForm({ ...form, location_index: Number(e.target.value) })}
          >
            {LOCATION_OPTIONS.map((loc, i) => (
              <option key={i} value={i}>{loc.label}</option>
            ))}
          </select>
        </div>

        {/* Notas adicionales — campo libre opcional */}
        <div style={styles.field}>
          <label style={styles.label}>Notas adicionales (opcional)</label>
          <input
            style={styles.input}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Detalles adicionales..."
          />
        </div>

        {/* Resumen */}
        <div style={styles.summary}>
          <span style={styles.summaryText}>
            📋 {NEED_OPTIONS.find(n => n.value === form.need_type)?.label} · {form.resource_category} · {form.quantity} · {PRIORITY_OPTIONS.find(p => p.value === form.priority)?.label} · {LOCATION_OPTIONS[form.location_index].label}
          </span>
        </div>

        <button
          style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? 'Enviando...' : '📡 Enviar ticket COM'}
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  openBtn: {
    padding: '10px 16px',
    background: '#534ab7',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
  },
  container: {
    background: '#1a1d26',
    border: '1px solid #2a2d3e',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid #2a2d3e',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#e8e8e8',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#8b8fa8',
    fontSize: '14px',
    cursor: 'pointer',
  },
  form: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '11px',
    color: '#8b8fa8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '.05em',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
  },
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '6px',
  },
  optBtn: {
    padding: '8px 6px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  select: {
    background: '#0f1117',
    border: '1px solid #2a2d3e',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#e8e8e8',
    fontSize: '13px',
  },
  input: {
    background: '#0f1117',
    border: '1px solid #2a2d3e',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#e8e8e8',
    fontSize: '13px',
  },
  summary: {
    background: '#0f1117',
    border: '1px solid #2a2d3e',
    borderRadius: '6px',
    padding: '10px 12px',
  },
  summaryText: {
    fontSize: '12px',
    color: '#8b8fa8',
  },
  submitBtn: {
    padding: '12px',
    background: '#1d9e75',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
}