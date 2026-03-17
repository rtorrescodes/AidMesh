package models

import "time"

type TicketStatus string
type TicketPriority string
type NeedType string
type ResourceCategory string

const (
	TicketStatusOpen       TicketStatus = "abierto"
	TicketStatusAssigned   TicketStatus = "asignado"
	TicketStatusInProgress TicketStatus = "en_progreso"
	TicketStatusResolved   TicketStatus = "resuelto"
	TicketStatusClosed     TicketStatus = "cerrado"

	PriorityLow      TicketPriority = "baja"
	PriorityMedium   TicketPriority = "media"
	PriorityHigh     TicketPriority = "alta"
	PriorityCritical TicketPriority = "critica"

	NeedTypeFood        NeedType = "alimento"
	NeedTypeWater       NeedType = "agua"
	NeedTypeMedical     NeedType = "medico"
	NeedTypeShelter     NeedType = "albergue"
	NeedTypeRescue      NeedType = "rescate"
	NeedTypeTransport   NeedType = "transporte"
	NeedTypeSupplies    NeedType = "suministros"
	NeedTypeSecurity    NeedType = "seguridad"

	ResourceFood        ResourceCategory = "víveres"
	ResourceMedicine    ResourceCategory = "medicamentos"
	ResourceEquipment   ResourceCategory = "equipo"
	ResourcePersonnel   ResourceCategory = "personal"
	ResourceVehicle     ResourceCategory = "vehículo"
	ResourceShelter     ResourceCategory = "albergue"
)

type COMTicket struct {
	ID               string                 `json:"id" db:"id"`
	EventID          string                 `json:"event_id" db:"event_id"`
	NeedType         NeedType               `json:"need_type" db:"need_type"`
	ResourceCategory ResourceCategory       `json:"resource_category" db:"resource_category"`
	Priority         TicketPriority         `json:"priority" db:"priority"`
	Status           TicketStatus           `json:"status" db:"status"`
	Quantity         *int                   `json:"quantity,omitempty" db:"quantity"`
	Latitude         float64                `json:"latitude" db:"latitude"`
	Longitude        float64                `json:"longitude" db:"longitude"`
	Description      *string                `json:"description,omitempty" db:"description"`
	Payload          map[string]interface{} `json:"payload" db:"payload"`
	ReportCount      int                    `json:"report_count" db:"report_count"`
	CreatedBy        *string                `json:"created_by,omitempty" db:"created_by"`
	AssignedTo       *string                `json:"assigned_to,omitempty" db:"assigned_to"`
	OrgID            *string                `json:"org_id,omitempty" db:"org_id"`
	CreatedAt        time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time              `json:"updated_at" db:"updated_at"`
	ResolvedAt       *time.Time             `json:"resolved_at,omitempty" db:"resolved_at"`
}

type CreateTicketRequest struct {
	EventID          string           `json:"event_id" binding:"required"`
	NeedType         NeedType         `json:"need_type" binding:"required"`
	ResourceCategory ResourceCategory `json:"resource_category" binding:"required"`
	Priority         TicketPriority   `json:"priority" binding:"required"`
	Quantity         *int             `json:"quantity"`
	Latitude         float64          `json:"latitude" binding:"required"`
	Longitude        float64          `json:"longitude" binding:"required"`
	Description      *string          `json:"description"`
}

type UpdateTicketRequest struct {
	Status     *TicketStatus  `json:"status"`
	AssignedTo *string        `json:"assigned_to"`
	Priority   *TicketPriority `json:"priority"`
}

type TicketMQTTPayload struct {
	TicketID  string      `json:"ticket_id"`
	EventID   string      `json:"event_id"`
	NeedType  NeedType    `json:"need_type"`
	Priority  TicketPriority `json:"priority"`
	Latitude  float64     `json:"latitude"`
	Longitude float64     `json:"longitude"`
	Timestamp time.Time   `json:"timestamp"`
}