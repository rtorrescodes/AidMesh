package models

import "time"

type SignalStatus string

const (
	SignalStatusPending   SignalStatus = "pendiente"
	SignalStatusReviewed  SignalStatus = "revisada"
	SignalStatusConfirmed SignalStatus = "confirmada"
	SignalStatusRejected  SignalStatus = "rechazada"
)

type CitizenSignal struct {
	ID             string       `json:"id" db:"id"`
	EventID        string       `json:"event_id" db:"event_id"`
	RawMessage     string       `json:"raw_message" db:"raw_message"`
	Latitude       *float64     `json:"latitude,omitempty" db:"latitude"`
	Longitude      *float64     `json:"longitude,omitempty" db:"longitude"`
	ContactInfo    *string      `json:"contact_info,omitempty" db:"contact_info"`
	Status         SignalStatus `json:"status" db:"status"`
	LinkedTicketID *string      `json:"linked_ticket_id,omitempty" db:"linked_ticket_id"`
	ReviewedBy     *string      `json:"reviewed_by,omitempty" db:"reviewed_by"`
	ReviewedAt     *time.Time   `json:"reviewed_at,omitempty" db:"reviewed_at"`
	CreatedAt      time.Time    `json:"created_at" db:"created_at"`
}

type CreateSignalRequest struct {
	EventID     string   `json:"event_id" binding:"required"`
	RawMessage  string   `json:"raw_message" binding:"required"`
	Latitude    *float64 `json:"latitude"`
	Longitude   *float64 `json:"longitude"`
	ContactInfo *string  `json:"contact_info"`
}

type ReviewSignalRequest struct {
	Action         string  `json:"action" binding:"required"` // confirm | reject
	LinkedTicketID *string `json:"linked_ticket_id"`
}
