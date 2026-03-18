package mqtt

// Topics MQTT — fuente de verdad del sistema COM
const (
	// Tickets
	TopicTicketsNew      = "com/tickets/new"
	TopicTicketsAssigned = "com/tickets/assigned"        // ← NUEVO
	TopicTicketUpdate    = "com/tickets/%s/update"

	// Broadcast
	TopicBroadcastAlert = "com/broadcast/alert"
	TopicOpenMessage    = "com/open/%s"

	// Ciudadanos
	TopicCitizenSignalRaw = "citizen/signal/raw"

	// Escalación (Etapa 2 — OpenClaw)
	TopicEscalation = "com/escalation/%s"

	// IoT / Vehículos (Etapa 2)
	TopicVehicleGPS = "vehicles/gps/%s"
	TopicIoTSensor  = "iot/sensors/%s"
)