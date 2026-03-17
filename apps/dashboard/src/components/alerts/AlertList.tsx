'use client'

import { Alert, AlertSeverity, AlertStatus, SEVERITY_COLORS } from '@/types'
import { alertsAPI } from '@/lib/api'
import { useState } from 'react'

interface Props {
  alerts: Alert[]
  onResolve: () => void
}

const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  [AlertSeverity.GREEN]: 'Verde',
  [AlertSeverity.YELLOW]: 'Amarillo',
  [AlertSeverity.ORANGE]: 'Naranja',
  [AlertSeverity.RED]: 'Rojo',
}

const TYPE_LABELS: Record<string, string> = {
  huracan: 'Huracán',
  sismo: 'Sismo',
  tsunami: 'Tsunami',
  inundacion: 'Inundación',
  incendio: 'Incendio',
  busqueda_rescate: 'Búsqueda y Rescate',
  salud_publica: 'Salud Pública',
  seguridad_civil: 'Seguridad Civil',
}

export default function AlertList({ alerts, onResolve }: Props) {
  const [resolving, setResolving] = useState<string | null>(null)

  async function handleResolve(id: string) {
    setResolving(id)
    try {
      await alertsAPI.resolve(id)
      onResolve()
    } catch (err) {
      console.error('Error resolviendo alerta:', err)
    } finally {
      setResolving(null)
    }
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>
        Alertas activas
        <span style={styles.count}>{alerts.length}</span>
      </h3>

      {alerts.length === 0 ? (
        <p style={styles.empty}>Sin alertas activas</p>
      ) : (
        <div style={styles.list}>
          {alerts
            .sort((a, b) => {
              const order = { rojo: 0, naranja: 1, amarillo: 2, verde: 3 }
              return (order[a.severity as keyof typeof order] ?? 4) -
                     (order[b.severity as keyof typeof order] ?? 4)
            })
            .map((alert) => (
              <div key={alert.id} style={styles.item}>
                <div
                  style={{
                    ...styles.severityBar,
                    background: SEVERITY_COLORS[alert.severity],
                  }}
                />
                <div style={styles.itemContent}>
                  <div style={styles.itemHeader}>
                    <span style={styles.itemType}>
                      {TYPE_LABELS[alert.type] || alert.type}
                    </span>
                    <span
                      style={{
                        ...styles.severityBadge,
                        background: SEVERITY_COLORS[alert.severity] + '22',
                        color: SEVERITY_COLORS[alert.severity],
                        border: `1px solid ${SEVERITY_COLORS[alert.severity]}44`,
                      }}
                    >
                      {SEVERITY_LABELS[alert.severity]}
                    </span>
                  </div>

                  {alert.title && (
                    <p style={styles.itemTitle}>{alert.title}</p>
                  )}

                  {alert.description && (
                    <p style={styles.itemDesc}>{alert.description}</p>
                  )}

                  <div style={styles.itemMeta}>
                    <span style={styles.metaItem}>
                      📍 {Number(alert.latitude).toFixed(4)}, {Number(alert.longitude).toFixed(4)}
                    </span>
                    <span style={styles.metaItem}>
                      Radio: {alert.radius_km} km
                    </span>
                    <span style={styles.metaItem}>
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  style={{
                    ...styles.resolveBtn,
                    opacity: resolving === alert.id ? 0.6 : 1,
                  }}
                  onClick={() => handleResolve(alert.id)}
                  disabled={resolving === alert.id}
                >
                  {resolving === alert.id ? '...' : 'Resolver'}
                </button>
              </div>
            ))}
        </div>
      )}
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
  empty: {
    fontSize: '12px',
    color: '#8b8fa8',
    fontStyle: 'italic',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  item: {
    display: 'flex',
    alignItems: 'stretch',
    background: '#0f1117',
    border: '1px solid #2a2d3e',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  severityBar: {
    width: '4px',
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    padding: '10px 12px',
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  itemType: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#e8e8e8',
  },
  severityBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 7px',
    borderRadius: '10px',
  },
  itemTitle: {
    fontSize: '12px',
    color: '#e8e8e8',
    marginBottom: '4px',
  },
  itemDesc: {
    fontSize: '11px',
    color: '#8b8fa8',
    marginBottom: '6px',
  },
  itemMeta: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  metaItem: {
    fontSize: '10px',
    color: '#8b8fa8',
  },
  resolveBtn: {
    padding: '0 14px',
    background: 'transparent',
    border: 'none',
    borderLeft: '1px solid #2a2d3e',
    color: '#1d9e75',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    flexShrink: 0,
  },
}