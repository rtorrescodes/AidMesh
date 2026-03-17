package mqtt

// Topics MQTT — fuente de verdad del sistema COM
const (
	TopicTicketsNew        = "com/tickets/new"
	TopicTicketUpdate      = "com/tickets/%s/update"
	TopicBroadcastAlert    = "com/broadcast/alert"
	TopicOpenMessage       = "com/open/%s"
	TopicCitizenSignalRaw  = "citizen/signal/raw"
	TopicEscalation        = "com/escalation/%s"
	TopicVehicleGPS        = "vehicles/gps/%s"
	TopicIoTSensor         = "iot/sensors/%s"
)