import mqtt, { MqttClient } from 'mqtt'

let client: MqttClient | null = null

export function getMQTTClient(): MqttClient {
  if (client && client.connected) return client

  const MQTT_URL = process.env.NEXT_PUBLIC_MQTT_URL || 'ws://localhost:8083/mqtt'

  client = mqtt.connect(MQTT_URL, {
    clientId: `dashboard-${Math.random().toString(16).slice(2)}`,
    clean: true,
    reconnectPeriod: 3000,
  })

  client.on('connect', () => {
    console.log('Dashboard MQTT conectado')
  })

  client.on('error', (err) => {
    console.error('MQTT error:', err)
  })

  return client
}

export function subscribeToEvent(
  eventId: string,
  onMessage: (topic: string, payload: any) => void,
) {
  const c = getMQTTClient()

  const topics = [
    'alerts/new',
    'alerts/resolved',
    'com/tickets/new',
    'com/tickets/+/update',
    'com/broadcast/alert',
    'citizen/signal/raw',
    `com/escalation/${eventId}`,
  ]

  topics.forEach((topic) => c.subscribe(topic, { qos: 1 }))

  const handler = (topic: string, message: Buffer) => {
    let payload: any = {}
    try {
      payload = JSON.parse(message.toString())
    } catch {
      payload = { raw: message.toString() }
    }
    onMessage(topic, payload)
  }

  c.on('message', handler)

  return () => {
    topics.forEach((topic) => c.unsubscribe(topic))
    c.off('message', handler)
  }
}