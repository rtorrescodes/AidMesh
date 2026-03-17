package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rtorrescodes/aidmesh/maps-service/internal/models"
)

type MapsRepository struct {
	db *pgxpool.Pool
}

func NewMapsRepository(db *pgxpool.Pool) *MapsRepository {
	return &MapsRepository{db: db}
}

func (r *MapsRepository) CreateLayer(ctx context.Context, req models.CreateLayerRequest, createdBy *string) (*models.MapLayer, error) {
	id := uuid.New().String()
	now := time.Now()

	geomJSON, err := json.Marshal(req.Geom)
	if err != nil {
		return nil, fmt.Errorf("error serializando geometría: %w", err)
	}

	metaJSON, err := json.Marshal(req.Metadata)
	if err != nil {
		return nil, fmt.Errorf("error serializando metadata: %w", err)
	}

	_, err = r.db.Exec(ctx, `
		INSERT INTO map_layers (id, name, layer_type, event_id, org_id, geom, metadata, is_visible, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, true, $8, $9, $9)
	`, id, req.Name, req.LayerType, req.EventID, req.OrgID, geomJSON, metaJSON, createdBy, now)

	if err != nil {
		return nil, fmt.Errorf("error creando layer: %w", err)
	}

	return r.GetLayerByID(ctx, id)
}

func (r *MapsRepository) GetLayersByEvent(ctx context.Context, eventID string) ([]models.MapLayer, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, name, layer_type, event_id, org_id, geom, metadata, is_visible, created_by, created_at, updated_at
		FROM map_layers
		WHERE event_id = $1
		ORDER BY created_at DESC
	`, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var layers []models.MapLayer
	for rows.Next() {
		var l models.MapLayer
		var geomJSON, metaJSON []byte
		err := rows.Scan(&l.ID, &l.Name, &l.LayerType, &l.EventID, &l.OrgID,
			&geomJSON, &metaJSON, &l.IsVisible, &l.CreatedBy, &l.CreatedAt, &l.UpdatedAt)
		if err != nil {
			return nil, err
		}
		json.Unmarshal(geomJSON, &l.Geom)
		json.Unmarshal(metaJSON, &l.Metadata)
		layers = append(layers, l)
	}
	return layers, nil
}

func (r *MapsRepository) GetLayerByID(ctx context.Context, id string) (*models.MapLayer, error) {
	var l models.MapLayer
	var geomJSON, metaJSON []byte

	err := r.db.QueryRow(ctx, `
		SELECT id, name, layer_type, event_id, org_id, geom, metadata, is_visible, created_by, created_at, updated_at
		FROM map_layers WHERE id = $1
	`, id).Scan(&l.ID, &l.Name, &l.LayerType, &l.EventID, &l.OrgID,
		&geomJSON, &metaJSON, &l.IsVisible, &l.CreatedBy, &l.CreatedAt, &l.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("layer no encontrado: %w", err)
	}

	json.Unmarshal(geomJSON, &l.Geom)
	json.Unmarshal(metaJSON, &l.Metadata)
	return &l, nil
}

func (r *MapsRepository) CreateRoute(ctx context.Context, req models.CreateRouteRequest, createdBy *string) (*models.EmergencyRoute, error) {
	id := uuid.New().String()
	now := time.Now()

	waypointsJSON, err := json.Marshal(req.Waypoints)
	if err != nil {
		return nil, fmt.Errorf("error serializando waypoints: %w", err)
	}

	_, err = r.db.Exec(ctx, `
		INSERT INTO emergency_routes (id, name, event_id, org_id, waypoints, description, is_active, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5::jsonb, $6, true, $7, $8, $8)
	`, id, req.Name, req.EventID, req.OrgID, waypointsJSON, req.Description, createdBy, now)

	if err != nil {
		return nil, fmt.Errorf("error creando ruta: %w", err)
	}

	return r.GetRouteByID(ctx, id)
}

func (r *MapsRepository) GetRoutesByEvent(ctx context.Context, eventID string) ([]models.EmergencyRoute, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, name, event_id, org_id, waypoints, description, is_active, created_by, created_at, updated_at
		FROM emergency_routes
		WHERE event_id = $1
		ORDER BY created_at DESC
	`, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var routes []models.EmergencyRoute
	for rows.Next() {
		var route models.EmergencyRoute
		var waypointsJSON []byte
		err := rows.Scan(&route.ID, &route.Name, &route.EventID, &route.OrgID,
			&waypointsJSON, &route.Description, &route.IsActive, &route.CreatedBy,
			&route.CreatedAt, &route.UpdatedAt)
		if err != nil {
			return nil, err
		}
		json.Unmarshal(waypointsJSON, &route.Waypoints)
		routes = append(routes, route)
	}
	return routes, nil
}

func (r *MapsRepository) GetRouteByID(ctx context.Context, id string) (*models.EmergencyRoute, error) {
	var route models.EmergencyRoute
	var waypointsJSON []byte

	err := r.db.QueryRow(ctx, `
		SELECT id, name, event_id, org_id, waypoints, description, is_active, created_by, created_at, updated_at
		FROM emergency_routes WHERE id = $1
	`, id).Scan(&route.ID, &route.Name, &route.EventID, &route.OrgID,
		&waypointsJSON, &route.Description, &route.IsActive, &route.CreatedBy,
		&route.CreatedAt, &route.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("ruta no encontrada: %w", err)
	}

	json.Unmarshal(waypointsJSON, &route.Waypoints)
	return &route, nil
}