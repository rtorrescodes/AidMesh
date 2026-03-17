package models

import "time"

type LayerType string

const (
	LayerTypeAlert      LayerType = "alert"
	LayerTypeShelter    LayerType = "shelter"
	LayerTypeHospital   LayerType = "hospital"
	LayerTypePolice     LayerType = "police"
	LayerTypeVehicle    LayerType = "vehicle"
	LayerTypeEvacuation LayerType = "evacuation"
)

type MapLayer struct {
	ID        string                 `json:"id" db:"id"`
	Name      string                 `json:"name" db:"name"`
	LayerType LayerType              `json:"layer_type" db:"layer_type"`
	EventID   string                 `json:"event_id" db:"event_id"`
	OrgID     *string                `json:"org_id,omitempty" db:"org_id"`
	Geom      map[string]interface{} `json:"geom" db:"geom"`
	Metadata  map[string]interface{} `json:"metadata,omitempty" db:"metadata"`
	IsVisible bool                   `json:"is_visible" db:"is_visible"`
	CreatedBy *string                `json:"created_by,omitempty" db:"created_by"`
	CreatedAt time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt time.Time              `json:"updated_at" db:"updated_at"`
}

type CreateLayerRequest struct {
	Name      string                 `json:"name" binding:"required"`
	LayerType LayerType              `json:"layer_type" binding:"required"`
	EventID   string                 `json:"event_id" binding:"required"`
	OrgID     *string                `json:"org_id"`
	Geom      map[string]interface{} `json:"geom" binding:"required"`
	Metadata  map[string]interface{} `json:"metadata"`
}