package models

import "time"

type EmergencyRoute struct {
	ID          string                   `json:"id" db:"id"`
	Name        string                   `json:"name" db:"name"`
	EventID     string                   `json:"event_id" db:"event_id"`
	OrgID       *string                  `json:"org_id,omitempty" db:"org_id"`
	Waypoints   []map[string]interface{} `json:"waypoints" db:"waypoints"`
	Description *string                  `json:"description,omitempty" db:"description"`
	IsActive    bool                     `json:"is_active" db:"is_active"`
	CreatedBy   *string                  `json:"created_by,omitempty" db:"created_by"`
	CreatedAt   time.Time                `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time                `json:"updated_at" db:"updated_at"`
}

type CreateRouteRequest struct {
	Name        string                   `json:"name" binding:"required"`
	EventID     string                   `json:"event_id" binding:"required"`
	OrgID       *string                  `json:"org_id"`
	Waypoints   []map[string]interface{} `json:"waypoints" binding:"required"`
	Description *string                  `json:"description"`
}