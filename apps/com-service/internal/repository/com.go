package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rtorrescodes/aidmesh/com-service/internal/models"
)

type COMRepository struct {
	db *pgxpool.Pool
}

func NewCOMRepository(db *pgxpool.Pool) *COMRepository {
	return &COMRepository{db: db}
}

// ─── TICKETS ──────────────────────────────────────────────────────

func (r *COMRepository) CreateTicket(
	ctx context.Context,
	req models.CreateTicketRequest,
	createdBy *string,
	orgID *string,
) (*models.COMTicket, error) {

	// Deduplicación: mismo need_type + zona cercana (0.01 grados ≈ 1km)
	var existingID string
	err := r.db.QueryRow(ctx, `
		SELECT id FROM com_tickets
		WHERE event_id    = $1
		  AND need_type   = $2
		  AND status      NOT IN ('cerrado', 'archivado')
		  AND ABS(latitude  - $3) < 0.01
		  AND ABS(longitude - $4) < 0.01
		LIMIT 1
	`, req.EventID, req.NeedType, req.Latitude, req.Longitude).Scan(&existingID)

	if err == nil && existingID != "" {
		// Ticket duplicado — incrementar report_count
		var ticket models.COMTicket
		err = r.db.QueryRow(ctx, `
			UPDATE com_tickets
			SET report_count = report_count + 1,
			    updated_at   = NOW()
			WHERE id = $1
			RETURNING `+ticketColumns, existingID).Scan(ticketScanFields(&ticket)...)
		if err != nil {
			return nil, fmt.Errorf("error actualizando report_count: %w", err)
		}
		return &ticket, nil
	}

	// Ticket nuevo
	var ticket models.COMTicket
	err = r.db.QueryRow(ctx, `
		INSERT INTO com_tickets (
			event_id, need_type, resource_category, priority, status,
			quantity, latitude, longitude,
			location,
			description, created_by, org_id
		) VALUES (
			$1, $2, $3, $4, 'nuevo',
			$5, $6, $7,
			ST_SetSRID(ST_MakePoint($7::numeric, $6::numeric), 4326),
			$8, $9, $10
		)
		RETURNING `+ticketColumns,
		req.EventID, req.NeedType, req.ResourceCategory, req.Priority,
		req.Quantity, req.Latitude, req.Longitude,
		req.Description, createdBy, orgID,
	).Scan(ticketScanFields(&ticket)...)

	if err != nil {
		return nil, fmt.Errorf("error creando ticket: %w", err)
	}
	return &ticket, nil
}

func (r *COMRepository) GetTicketsByEvent(
	ctx context.Context,
	eventID string,
	status *string,
) ([]models.COMTicket, error) {

	query := `SELECT ` + ticketColumns + ` FROM com_tickets WHERE event_id = $1`
	args := []interface{}{eventID}

	if status != nil {
		query += ` AND status = $2`
		args = append(args, *status)
	}

	query += ` ORDER BY
		CASE priority
			WHEN 'critica' THEN 1
			WHEN 'alta'    THEN 2
			WHEN 'media'   THEN 3
			WHEN 'baja'    THEN 4
		END,
		created_at DESC`

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("error consultando tickets: %w", err)
	}
	defer rows.Close()

	var tickets []models.COMTicket
	for rows.Next() {
		var t models.COMTicket
		if err := rows.Scan(ticketScanFields(&t)...); err != nil {
			return nil, err
		}
		tickets = append(tickets, t)
	}
	return tickets, nil
}

func (r *COMRepository) GetTicketByID(ctx context.Context, id string) (*models.COMTicket, error) {
	var ticket models.COMTicket
	err := r.db.QueryRow(ctx,
		`SELECT `+ticketColumns+` FROM com_tickets WHERE id = $1`, id,
	).Scan(ticketScanFields(&ticket)...)
	if err != nil {
		return nil, fmt.Errorf("ticket no encontrado: %w", err)
	}
	return &ticket, nil
}

func (r *COMRepository) UpdateTicket(
	ctx context.Context,
	id string,
	req models.UpdateTicketRequest,
	updatedBy string,
) (*models.COMTicket, error) {

	query := `UPDATE com_tickets SET updated_at = NOW()`
	args  := []interface{}{}
	i     := 1

	if req.Status != nil {
		query += fmt.Sprintf(`, status = $%d`, i)
		args = append(args, *req.Status)
		i++
	}
	if req.Priority != nil {
		query += fmt.Sprintf(`, priority = $%d`, i)
		args = append(args, *req.Priority)
		i++
	}

	query += fmt.Sprintf(` WHERE id = $%d RETURNING `+ticketColumns, i)
	args = append(args, id)

	var ticket models.COMTicket
	err := r.db.QueryRow(ctx, query, args...).Scan(ticketScanFields(&ticket)...)
	if err != nil {
		return nil, fmt.Errorf("error actualizando ticket: %w", err)
	}
	return &ticket, nil
}

// AssignTicket — asigna un ticket a un usuario específico con trazabilidad completa
func (r *COMRepository) AssignTicket(
	ctx context.Context,
	ticketID string,
	assignedTo string,
	assignedBy string,
) (*models.COMTicket, error) {

	var ticket models.COMTicket
	err := r.db.QueryRow(ctx, `
		UPDATE com_tickets
		SET status      = 'asignado',
		    assigned_to = $1,
		    assigned_by = $2,
		    assigned_at = NOW(),
		    updated_at  = NOW()
		WHERE id = $3
		RETURNING `+ticketColumns,
		assignedTo, assignedBy, ticketID,
	).Scan(ticketScanFields(&ticket)...)

	if err != nil {
		return nil, fmt.Errorf("error asignando ticket: %w", err)
	}
	return &ticket, nil
}

// GetAssignableUsers — usuarios activos en un evento disponibles para asignación
func (r *COMRepository) GetAssignableUsers(
	ctx context.Context,
	eventID string,
) ([]models.AssignableUser, error) {

	// Por ahora devuelve todos los usuarios activos nivel 1+ en el sistema
	// En Etapa 2 esto filtrará por usuarios registrados en el evento específico
	rows, err := r.db.Query(ctx, `
		SELECT id, name, email, trust_level, org_id
		FROM users
		WHERE is_active   = true
		  AND trust_level >= 1
		ORDER BY name ASC
	`)
	if err != nil {
		return nil, fmt.Errorf("error consultando usuarios asignables: %w", err)
	}
	defer rows.Close()

	var users []models.AssignableUser
	for rows.Next() {
		var u models.AssignableUser
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.TrustLevel, &u.OrgID); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

// ─── SEÑALES CIUDADANAS ───────────────────────────────────────────

func (r *COMRepository) CreateSignal(
	ctx context.Context,
	req models.CreateSignalRequest,
) (*models.CitizenSignal, error) {

	var signal models.CitizenSignal
	err := r.db.QueryRow(ctx, `
		INSERT INTO citizen_signals (
			event_id, raw_message, latitude, longitude,
			location, contact_info
		) VALUES (
			$1, $2, $3, $4,
			ST_SetSRID(ST_MakePoint($4, $3), 4326),
			$5
		)
		RETURNING id, event_id, raw_message, latitude, longitude,
		          contact_info, status, linked_ticket_id,
		          reviewed_by, reviewed_at, created_at`,
		req.EventID, req.RawMessage, req.Latitude, req.Longitude, req.ContactInfo,
	).Scan(
		&signal.ID, &signal.EventID, &signal.RawMessage,
		&signal.Latitude, &signal.Longitude, &signal.ContactInfo,
		&signal.Status, &signal.LinkedTicketID,
		&signal.ReviewedBy, &signal.ReviewedAt, &signal.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("error creando señal ciudadana: %w", err)
	}
	return &signal, nil
}

func (r *COMRepository) GetSignalsByEvent(
	ctx context.Context,
	eventID string,
) ([]models.CitizenSignal, error) {

	rows, err := r.db.Query(ctx, `
		SELECT id, event_id, raw_message, latitude, longitude,
		       contact_info, status, linked_ticket_id,
		       reviewed_by, reviewed_at, created_at
		FROM citizen_signals
		WHERE event_id = $1
		ORDER BY created_at DESC
	`, eventID)
	if err != nil {
		return nil, fmt.Errorf("error consultando señales: %w", err)
	}
	defer rows.Close()

	var signals []models.CitizenSignal
	for rows.Next() {
		var s models.CitizenSignal
		if err := rows.Scan(
			&s.ID, &s.EventID, &s.RawMessage,
			&s.Latitude, &s.Longitude, &s.ContactInfo,
			&s.Status, &s.LinkedTicketID,
			&s.ReviewedBy, &s.ReviewedAt, &s.CreatedAt,
		); err != nil {
			return nil, err
		}
		signals = append(signals, s)
	}
	return signals, nil
}

// ─── HELPERS INTERNOS ─────────────────────────────────────────────

// ticketColumns — columnas en el mismo orden que ticketScanFields
const ticketColumns = `
	id, event_id, need_type, resource_category, priority, status,
	quantity, latitude, longitude, description, payload, report_count,
	created_by, assigned_to, assigned_by, assigned_at, org_id,
	created_at, updated_at, resolved_at, delayed_at, archived_at`

func ticketScanFields(t *models.COMTicket) []interface{} {
	return []interface{}{
		&t.ID, &t.EventID, &t.NeedType, &t.ResourceCategory,
		&t.Priority, &t.Status,
		&t.Quantity, &t.Latitude, &t.Longitude,
		&t.Description, (*payloadScanner)(&t.Payload), &t.ReportCount,
		&t.CreatedBy, &t.AssignedTo, &t.AssignedBy, &t.AssignedAt,
		&t.OrgID,
		&t.CreatedAt, &t.UpdatedAt, &t.ResolvedAt,
		&t.DelayedAt, &t.ArchivedAt,
	}
}

// payloadScanner convierte JSONB de postgres a map[string]interface{}
type payloadScanner map[string]interface{}

func (p *payloadScanner) Scan(src interface{}) error {
	if src == nil {
		*p = map[string]interface{}{}
		return nil
	}
	var b []byte
	switch v := src.(type) {
	case []byte:
		b = v
	case string:
		b = []byte(v)
	default:
		return fmt.Errorf("payloadScanner: tipo inesperado %T", src)
	}
	return json.Unmarshal(b, p)
}

// ─── WIDGET PREFERENCES ───────────────────────────────────────────

func (r *COMRepository) GetWidgetPreferences(
	ctx context.Context,
	userID string,
	eventID string,
	scope string,
) (map[string]interface{}, error) {

	var raw []byte
	err := r.db.QueryRow(ctx, `
		SELECT preferences FROM widget_preferences
		WHERE user_id = $1 AND event_id = $2 AND scope = $3
	`, userID, eventID, scope).Scan(&raw)

	if err != nil {
		// Si no existe, devolver defaults
		return defaultWidgetPreferences(), nil
	}

	var prefs map[string]interface{}
	if err := json.Unmarshal(raw, &prefs); err != nil {
		return nil, err
	}
	return prefs, nil
}

func (r *COMRepository) SaveWidgetPreferences(
	ctx context.Context,
	userID string,
	eventID string,
	scope string,
	prefs map[string]interface{},
) error {

	raw, err := json.Marshal(prefs)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(ctx, `
		INSERT INTO widget_preferences (user_id, event_id, scope, preferences, updated_at)
		VALUES ($1, $2, $3, $4, NOW())
		ON CONFLICT (user_id, event_id, scope)
		DO UPDATE SET preferences = $4, updated_at = NOW()
	`, userID, eventID, scope, raw)
	return err
}

func defaultWidgetPreferences() map[string]interface{} {
	return map[string]interface{}{
		"status_bar":    true,
		"activity_log":  true,
		"mqtt_feed":     false,
		"map_layer_1":   true,  // Alertas — siempre visible
		"map_layer_2":   true,  // Tickets abiertos/en proceso
		"map_layer_3":   false, // Resueltos, albergues, hospitales
	}
}

// ─── AUDIT LOG ────────────────────────────────────────────────────

func (r *COMRepository) WriteAuditLog(
	ctx context.Context,
	entityType string,
	entityID string,
	action string,
	actorID string,
	actorEmail string,
	diff map[string]interface{},
) error {

	raw, _ := json.Marshal(diff)
	now := time.Now()
	_ = now

	_, err := r.db.Exec(ctx, `
		INSERT INTO audit_log (entity_type, entity_id, action, actor_id, actor_email, diff)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, entityType, entityID, action, actorID, actorEmail, raw)
	return err
}
// GetPendingSignals — señales ciudadanas pendientes de revisión por evento
func (r *COMRepository) GetPendingSignals(
	ctx context.Context,
	eventID string,
) ([]models.CitizenSignal, error) {

	rows, err := r.db.Query(ctx, `
		SELECT id, event_id, raw_message, latitude, longitude,
		       contact_info, status, linked_ticket_id,
		       reviewed_by, reviewed_at, created_at
		FROM citizen_signals
		WHERE event_id = $1
		  AND status   = 'pendiente'
		ORDER BY created_at DESC
	`, eventID)
	if err != nil {
		return nil, fmt.Errorf("error consultando señales pendientes: %w", err)
	}
	defer rows.Close()

	var signals []models.CitizenSignal
	for rows.Next() {
		var s models.CitizenSignal
		if err := rows.Scan(
			&s.ID, &s.EventID, &s.RawMessage,
			&s.Latitude, &s.Longitude, &s.ContactInfo,
			&s.Status, &s.LinkedTicketID,
			&s.ReviewedBy, &s.ReviewedAt, &s.CreatedAt,
		); err != nil {
			return nil, err
		}
		signals = append(signals, s)
	}
	return signals, nil
}

// ReviewSignal — confirma o rechaza una señal ciudadana
func (r *COMRepository) ReviewSignal(
	ctx context.Context,
	signalID string,
	req models.ReviewSignalRequest,
	reviewedBy string,
) (*models.CitizenSignal, error) {

	newStatus := "rechazada"
	if req.Action == "confirm" {
		newStatus = "confirmada"
	}

	var signal models.CitizenSignal
	err := r.db.QueryRow(ctx, `
		UPDATE citizen_signals
		SET status          = $1,
		    reviewed_by     = $2,
		    reviewed_at     = NOW(),
		    linked_ticket_id = COALESCE($3, linked_ticket_id)
		WHERE id = $4
		RETURNING id, event_id, raw_message, latitude, longitude,
		          contact_info, status, linked_ticket_id,
		          reviewed_by, reviewed_at, created_at`,
		newStatus, reviewedBy, req.LinkedTicketID, signalID,
	).Scan(
		&signal.ID, &signal.EventID, &signal.RawMessage,
		&signal.Latitude, &signal.Longitude, &signal.ContactInfo,
		&signal.Status, &signal.LinkedTicketID,
		&signal.ReviewedBy, &signal.ReviewedAt, &signal.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("error revisando señal: %w", err)
	}
	return &signal, nil
}