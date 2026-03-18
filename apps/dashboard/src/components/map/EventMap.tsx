'use client'

import { useEffect, useRef } from 'react'
import { Alert, AlertSeverity, SEVERITY_COLORS } from '@/types'

interface Props {
  alerts: Alert[]
  eventName?: string
}

const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  [AlertSeverity.GREEN]: 'Verde',
  [AlertSeverity.YELLOW]: 'Amarillo',
  [AlertSeverity.ORANGE]: 'Naranja',
  [AlertSeverity.RED]: 'Rojo',
}

export default function EventMap({ alerts, eventName }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    import('maplibre-gl').then((maplibre) => {
      const map = new maplibre.Map({
        container: mapContainer.current!,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors',
            },
          },
          layers: [
            {
              id: 'osm',
              type: 'raster',
              source: 'osm',
            },
          ],
        },
        center: [-110.3128, 24.1426],
        zoom: 7,
      })

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    const updateMarkers = async () => {
      const maplibre = await import('maplibre-gl')

      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      alerts.forEach((alert) => {
        const color = SEVERITY_COLORS[alert.severity]

        const el = document.createElement('div')
        el.style.cssText = `
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 0 10px ${color}88;
          cursor: pointer;
          animation: pulse 2s infinite;
        `

        const popup = new maplibre.Popup({ offset: 16 }).setHTML(`
          <div style="font-family: sans-serif; padding: 4px; min-width: 180px;">
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px; color: #1a1a2e;">
              ${alert.title || alert.type}
            </div>
            <div style="display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; background: ${color}22; color: ${color}; border: 1px solid ${color}44; margin-bottom: 6px;">
              ${SEVERITY_LABELS[alert.severity]}
            </div>
            ${alert.description ? `<div style="font-size: 11px; color: #555; margin-bottom: 4px;">${alert.description}</div>` : ''}
            <div style="font-size: 10px; color: #888;">
              Radio: ${alert.radius_km} km · ${new Date(alert.created_at).toLocaleString()}
            </div>
          </div>
        `)

        const marker = new maplibre.Marker({ element: el })
          .setLngLat([Number(alert.longitude), Number(alert.latitude)])
          .setPopup(popup)
          .addTo(mapRef.current)

        markersRef.current.push(marker)
      })

      if (alerts.length > 0) {
        if (alerts.length === 1) {
          mapRef.current.flyTo({
            center: [Number(alerts[0].longitude), Number(alerts[0].latitude)],
            zoom: 9,
            duration: 1500,
          })
        } else {
          const lngs = alerts.map((a) => Number(a.longitude))
          const lats = alerts.map((a) => Number(a.latitude))
          mapRef.current.fitBounds(
            [
              [Math.min(...lngs) - 0.5, Math.min(...lats) - 0.5],
              [Math.max(...lngs) + 0.5, Math.max(...lats) + 0.5],
            ],
            { padding: 60, duration: 1500 },
          )
        }
      }
    }

    const tryUpdate = () => {
      if (mapRef.current && mapRef.current.loaded()) {
        updateMarkers()
      } else if (mapRef.current) {
        mapRef.current.once('load', updateMarkers)
      }
    }

    setTimeout(tryUpdate, 100)
  }, [alerts])

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Mapa operativo</h3>
        <span style={styles.count}>{alerts.length} alertas activas</span>
      </div>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
          70% { box-shadow: 0 0 0 8px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
        .maplibregl-popup-content {
          border-radius: 8px !important;
          padding: 10px 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
        }
      `}</style>
      <div ref={mapContainer} style={styles.map} />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#1a1d26',
    border: '1px solid #2a2d3e',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  header: {
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #2a2d3e',
  },
  title: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#e8e8e8',
  },
  count: {
    fontSize: '11px',
    color: '#8b8fa8',
    background: '#2a2d3e',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  map: {
    height: '400px',
    width: '100%',
  },
}