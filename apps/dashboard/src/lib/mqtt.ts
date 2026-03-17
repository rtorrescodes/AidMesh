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

  client.on('disconnect', () => {
    console.log('MQTT desconectado')
  })

  return client
}

export function subscribeToEvent(eventId: string, onMessage: (topic: string, payload: any) => void) {
  const c = getMQTTClient()

  const topics = [
    `com/tickets/new`,
    `com/tickets/+/update`,
    `com/broadcast/alert`,
    `citizen/signal/raw`,
    `com/escalation/${eventId}`,
  ]

  topics.forEach((topic) => {
    c.subscribe(topic, { qos: 1 })
  })

  c.on('message', (topic, message) => {
    try {
      const payload = JSON.parse(message.toString())
      onMessage(topic, payload)
    } catch {
      onMessage(topic, message.toString())
    }
  })

  return () => {
    topics.forEach((topic) => c.unsubscribe(topic))
  }
}

export function publishSignal(eventId: string, data: any) {
  const c = getMQTTClient()
  c.publish('citizen/signal/raw', JSON.stringify(data), { qos: 1 })
}