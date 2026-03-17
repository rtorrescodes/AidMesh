'use client'

import { COMTicket, TicketStatus, TicketPriority, PRIORITY_COLORS } from '@/types'
import { ticketsAPI } from '@/lib/api'
import { useState } from 'react'

interface Props {
  tickets: COMTicket[]
  onUpdate: () => void
}

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  [TicketPriority.CRITICAL]: 'Crítica',
  [TicketPriority.HIGH]: 'Alta',
  [TicketPriority.MEDIUM]: 'Media',
  [TicketPriority.LOW]: 'Baja',
}

const STATUS_LABELS: Record<string, string> = {
  abierto: 'Abierto',
  asignado: 'Asignado',
  en_progreso: 'En progreso',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
}

const NEED_LABELS: Record<string, string> = {
  alimento: '🍽 Alimento',
  agua: '💧 Agua',
  medico: '🏥 Médico',
  albergue: '🏠 Albergue',
  rescate: '🚨 Rescate',
  transporte: '🚗 Transporte',
  suministros: '📦 Suministros',
  seguridad: '🛡 Seguridad',
}

const COLUMNS = [
  { key: 'abierto', label: 'Abierto' },
  { key: 'asignado', label: 'Asignado' },
  { key: 'en_progreso', label: 'En progreso' },
  { key: 'resuelto', label: 'Resuelto' },
]

export default function TicketBoard({ tickets, onUpdate }: Props) {
  const [updating, setUpdating] = useState<string | null>(null)

  async function handleStatusChange(ticketId: string, newStatus: string) {
    setUpdating(ticketId)
    try {
      await ticketsAPI.update(ticketId, { status: newStatus })
      onUpdate()
    } catch (err) {
      console.error('Error actualizando ticket:', err)
    } finally {
      setUpdating(null)
    }
  }

  const ticketsByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = tickets.filter((t) => t.status === col.key)
    return acc
  }, {} as Record<string, COMTicket[]>)

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>
        Tickets COM
        <span style={styles.count}>{tickets.length}</span>
      </h3>

      <div style={styles.board}>
        {COLUMNS.map((col) => (
          <div key={col.key} style={styles.column}>
            <div style={styles.columnHeader}>
              <span style={styles.columnTitle}>{col.label}</span>
              <span style={styles.columnCount}>
                {ticketsByStatus[col.key]?.length || 0}
              </span>
            </div>

            <div style={styles.columnBody}>
              {(ticketsByStatus[col.key] || []).length === 0 ? (
                <p style={styles.columnEmpty}>Sin tickets</p>
              ) : (
                (ticketsByStatus[col.key] || [])
                  .sort((a, b) => {
                    const order = { critica: 0, alta: 1, media: 2, baja: 3 }
                    return (order[a.priority as keyof typeof order] ?? 4) -
                           (order[b.priority as keyof typeof order] ?? 4)
                  })
                  .map((ticket) => (
                    <div key={ticket.id} style={styles.ticket}>
                      <div style={styles.ticketHeader}>
                        <span style={styles.needType}>
                          {NEED_LABELS[ticket.need_type] || ticket.need_type}
                        </span>
                        <span
                          style={{
                            ...styles.priorityBadge,
                            background: PRIORITY_COLORS[ticket.priority] + '22',
                            color: PRIORITY_COLORS[ticket.priority],
                            border: `1px solid ${PRIORITY_COLORS[ticket.priority]}44`,
                          }}
                        >
                          {PRIORITY_LABELS[ticket.priority]}
                        </span>
                      </div>

                      <p style={styles.ticketCategory}>
                        {ticket.resource_category}
                      </p>

                      {ticket.description && (
                        <p style={styles.ticketDesc}>{ticket.description}</p>
                      )}

                      <div style={styles.ticketMeta}>
                        {ticket.quantity && (
                          <span style={styles.metaItem}>
                            Cant: {ticket.quantity}
                          </span>
                        )}
                        {ticket.report_count > 1 && (
                          <span style={{ ...styles.metaItem, color: '#f07d18' }}>
                            🔁 {ticket.report_count} reportes
                          </span>
                        )}
                        <span style={styles.metaItem}>
                          📍 {Number(ticket.latitude).toFixed(3)}, {Number(ticket.longitude).toFixed(3)}
                        </span>
                      </div>

                      {col.key !== 'resuelto' && (
                        <div style={styles.ticketActions}>
                          {col.key === 'abierto' && (
                            <button
                              style={styles.actionBtn}
                              onClick={() => handleStatusChange(ticket.id, 'asignado')}
                              disabled={updating === ticket.id}
                            >
                              Asignar
                            </button>
                          )}
                          {col.key === 'asignado' && (
                            <button
                              style={styles.actionBtn}
                              onClick={() => handleStatusChange(ticket.id, 'en_progreso')}
                              disabled={updating === ticket.id}
                            >
                              Iniciar
                            </button>
                          )}
                          {col.key === 'en_progreso' && (
                            <button
                              style={{ ...styles.actionBtn, color: '#1d9e75' }}
                              onClick={() => handleStatusChange(ticket.id, 'resuelto')}
                              disabled={updating === ticket.id}
                            >
                              Resolver
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#1a1d26',
    border: '1px solid #2a2d3e',
    borderRadius: '8px',
    padding: '16px',
  },
  title: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#e8e8e8',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  count: {
    background: '#2a2d3e',
    color: '#8b8fa8',
    fontSize: '11px',
    padding: '2px 7px',
    borderRadius: '10px',
  },
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
  },
  column: {
    background: '#0f1117',
    borderRadius: '6px',
    border: '1px solid #2a2d3e',
    overflow: 'hidden',
  },
  columnHeader: {
    padding: '8px 10px',
    borderBottom: '1px solid #2a2d3e',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  columnTitle: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#8b8fa8',
    textTransform: 'uppercase',
    letterSpacing: '.05em',
  },
  columnCount: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#534ab7',
    background: '#534ab722',
    padding: '1px 6px',
    borderRadius: '10px',
  },
  columnBody: {
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minHeight: '100px',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  columnEmpty: {
    fontSize: '11px',
    color: '#8b8fa8',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '12px 0',
  },
  ticket: {
    background: '#1a1d26',
    border: '1px solid #2a2d3e',
    borderRadius: '6px',
    padding: '8px 10px',
  },
  ticketHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  needType: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#e8e8e8',
  },
  priorityBadge: {
    fontSize: '9px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '10px',
  },
  ticketCategory: {
    fontSize: '11px',
    color: '#8b8fa8',
    marginBottom: '4px',
  },
  ticketDesc: {
    fontSize: '11px',
    color: '#8b8fa8',
    marginBottom: '6px',
  },
  ticketMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginBottom: '6px',
  },
  metaItem: {
    fontSize: '10px',
    color: '#8b8fa8',
  },
  ticketActions: {
    display: 'flex',
    gap: '4px',
    marginTop: '6px',
  },
  actionBtn: {
    flex: 1,
    padding: '4px 8px',
    background: '#22263a',
    border: '1px solid #2a2d3e',
    borderRadius: '4px',
    color: '#534ab7',
    fontSize: '10px',
    fontWeight: '600',
    cursor: 'pointer',
  },
}