package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rtorrescodes/aidmesh/com-service/internal/models"
)

type COMRepository struct {
	db *pgxpool.Pool
}

func NewCOMRepository(db *pgxpool.Pool) *COMRepository {
	return &COMRepository{db: db}
}

// ─── TICKETS ─────────────────────────────────────────────────────

func (r *COMRepository) CreateTicket(ctx context.Context, req models.CreateTicketRequest, createdBy *string, orgID *string) (*models.COMTicket, error) {
	// Deduplicación: buscar ticket activo del mismo tipo + zona + evento
	existing, err := r.findDuplicateTicket(ctx, req)
	if err == nil && existing != nil {
		// Ticket duplicado — incrementar contador
		_, err = r.db.Exec(ctx, `
			UPDATE com_tickets
			SET report_count = report_count + 1, updated_at = $1
			WHERE id = $2
		`, time.Now(), existing.ID)
		if err != nil {
			return nil, fmt.Errorf("error actualizando contador: %w", err)
		}
		existing.ReportCount++
		return existing, nil
	}

	// Ticket nuevo
	id := uuid.New().String()
	now := time.Now()

	payload := map[string]interface{}{
		"need_type":         req.NeedType,
		"resource_category": req.ResourceCategory,
		"quantity":          req.Quantity,
		"description":       req.Description,
	}
	payloadJSON, _ := json.Marshal(payload)

	_, err = r.db.Exec(ctx, `
		INSERT INTO com_tickets (
			id, event_id, need_type, resource_category, priority, status,
			quantity, latitude, longitude, description, payload,
			report_count, created_by, org_id, created_at, updated_at
		) VALUES ($1,$2,$3,$4,$5,'abierto',$6,$7,$8,$9,$10::jsonb,1,$11,$12,$13,$13)
	`, id, req.EventID, req.NeedType, req.ResourceCategory, req.Priority,
		req.Quantity, req.Latitude, req.Longitude, req.Description,
		payloadJSON, createdBy, orgID, now)

	if err != nil {
		return nil, fmt.Errorf("error creando ticket: %w", err)
	}

	return r.GetTicketByID(ctx, id)
}

func (r *COMRepository) findDuplicateTicket(ctx context.Context, req models.CreateTicketRequest) (*models.COMTicket, error) {
	// Busca ticket activo mismo tipo + evento + zona (~500m)
	var ticket models.COMTicket
	var payloadJSON []byte

	err := r.db.QueryRow(ctx, `
		SELECT id, event_id, need_type, resource_category, priority, status,
			quantity, latitude, longitude, description, payload,
			report_count, created_by, org_id, created_at, updated_at
		FROM com_tickets
		WHERE event_id = $1
			AND need_type = $2
			AND status NOT IN ('resuelto', 'cerrado')
			AND ABS(latitude - $3) < 0.005
			AND ABS(longitude - $4) < 0.005
		ORDER BY created_at DESC
		LIMIT 1
	`, req.EventID, req.NeedType, req.Latitude, req.Longitude).Scan(
		&ticket.ID, &ticket.EventID, &ticket.NeedType, &ticket.ResourceCategory,
		&ticket.Priority, &ticket.Status, &ticket.Quantity, &ticket.Latitude,
		&ticket.Longitude, &ticket.Description, &payloadJSON,
		&ticket.ReportCount, &ticket.CreatedBy, &ticket.OrgID,
		&ticket.CreatedAt, &ticket.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	json.Unmarshal(payloadJSON, &ticket.Payload)
	return &ticket, nil
}

func (r *COMRepository) GetTicketByID(ctx context.Context, id string) (*models.COMTicket, error) {
	var ticket models.COMTicket
	var payloadJSON []byte

	err := r.db.QueryRow(ctx, `
		SELECT id, event_id, need_type, resource_category, priority, status,
			quantity, latitude, longitude, description, payload,
			report_count, created_by, assigned_to, org_id,
			created_at, updated_at, resolved_at
		FROM com_tickets WHERE id = $1
	`, id).Scan(
		&ticket.ID, &ticket.EventID, &ticket.NeedType, &ticket.ResourceCategory,
		&ticket.Priority, &ticket.Status, &ticket.Quantity, &ticket.Latitude,
		&ticket.Longitude, &ticket.Description, &payloadJSON,
		&ticket.ReportCount, &ticket.CreatedBy, &ticket.AssignedTo, &ticket.OrgID,
		&ticket.CreatedAt, &ticket.UpdatedAt, &ticket.ResolvedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("ticket no encontrado: %w", err)
	}

	json.Unmarshal(payloadJSON, &ticket.Payload)
	return &ticket, nil
}

func (r *COMRepository) GetTicketsByEvent(ctx context.Context, eventID string, status *string) ([]models.COMTicket, error) {
	query := `
		SELECT id, event_id, need_type, resource_category, priority, status,
			quantity, latitude, longitude, description, payload,
			report_count, created_by, assigned_to, org_id,
			created_at, updated_at, resolved_at
		FROM com_tickets
		WHERE event_id = $1
	`
	args := []interface{}{eventID}

	if status != nil {
		query += " AND status = $2"
		args = append(args, *status)
	}

	query += " ORDER BY priority DESC, created_at DESC"

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tickets []models.COMTicket
	for rows.Next() {
		var ticket models.COMTicket
		var payloadJSON []byte
		err := rows.Scan(
			&ticket.ID, &ticket.EventID, &ticket.NeedType, &ticket.ResourceCategory,
			&ticket.Priority, &ticket.Status, &ticket.Quantity, &ticket.Latitude,
			&ticket.Longitude, &ticket.Description, &payloadJSON,
			&ticket.ReportCount, &ticket.CreatedBy, &ticket.AssignedTo, &ticket.OrgID,
			&ticket.CreatedAt, &ticket.UpdatedAt, &ticket.ResolvedAt,
		)
		if err != nil {
			return nil, err
		}
		json.Unmarshal(payloadJSON, &ticket.Payload)
		tickets = append(tickets, ticket)
	}
	return tickets, nil
}

func (r *COMRepository) UpdateTicket(ctx context.Context, id string, req models.UpdateTicketRequest, userID string) (*models.COMTicket, error) {
	now := time.Now()

	if req.Status != nil && *req.Status == models.TicketStatusResolved {
		_, err := r.db.Exec(ctx, `
			UPDATE com_tickets
			SET status = $1, assigned_to = COALESCE($2, assigned_to),
				resolved_at = $3, updated_at = $3
			WHERE id = $4
		`, req.Status, req.AssignedTo, now, id)
		if err != nil {
			return nil, fmt.Errorf("error actualizando ticket: %w", err)
		}
	} else {
		_, err := r.db.Exec(ctx, `
			UPDATE com_tickets
			SET status = COALESCE($1, status),
				assigned_to = COALESCE($2, assigned_to),
				priority = COALESCE($3, priority),
				updated_at = $4
			WHERE id = $5
		`, req.Status, req.AssignedTo, req.Priority, now, id)
		if err != nil {
			return nil, fmt.Errorf("error actualizando ticket: %w", err)
		}
	}

	return r.GetTicketByID(ctx, id)
}

// ─── SEÑALES CIUDADANAS ───────────────────────────────────────────

func (r *COMRepository) CreateSignal(ctx context.Context, req models.CreateSignalRequest) (*models.CitizenSignal, error) {
	id := uuid.New().String()
	now := time.Now()

	_, err := r.db.Exec(ctx, `
		INSERT INTO citizen_signals (
			id, event_id, raw_message, latitude, longitude,
			contact_info, status, created_at
		) VALUES ($1,$2,$3,$4,$5,$6,'pendiente',$7)
	`, id, req.EventID, req.RawMessage, req.Latitude, req.Longitude, req.ContactInfo, now)

	if err != nil {
		return nil, fmt.Errorf("error creando señal: %w", err)
	}

	return r.GetSignalByID(ctx, id)
}

func (r *COMRepository) GetSignalByID(ctx context.Context, id string) (*models.CitizenSignal, error) {
	var signal models.CitizenSignal

	err := r.db.QueryRow(ctx, `
		SELECT id, event_id, raw_message, latitude, longitude,
			contact_info, status, linked_ticket_id,
			reviewed_by, reviewed_at, created_at
		FROM citizen_signals WHERE id = $1
	`, id).Scan(
		&signal.ID, &signal.EventID, &signal.RawMessage,
		&signal.Latitude, &signal.Longitude, &signal.ContactInfo,
		&signal.Status, &signal.LinkedTicketID,
		&signal.ReviewedBy, &signal.ReviewedAt, &signal.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("señal no encontrada: %w", err)
	}

	return &signal, nil
}

func (r *COMRepository) GetPendingSignals(ctx context.Context, eventID string) ([]models.CitizenSignal, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, event_id, raw_message, latitude, longitude,
			contact_info, status, linked_ticket_id,
			reviewed_by, reviewed_at, created_at
		FROM citizen_signals
		WHERE event_id = $1 AND status = 'pendiente'
		ORDER BY created_at ASC
	`, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var signals []models.CitizenSignal
	for rows.Next() {
		var s models.CitizenSignal
		err := rows.Scan(
			&s.ID, &s.EventID, &s.RawMessage,
			&s.Latitude, &s.Longitude, &s.ContactInfo,
			&s.Status, &s.LinkedTicketID,
			&s.ReviewedBy, &s.ReviewedAt, &s.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		signals = append(signals, s)
	}
	return signals, nil
}

func (r *COMRepository) ReviewSignal(ctx context.Context, id string, req models.ReviewSignalRequest, reviewerID string) (*models.CitizenSignal, error) {
	now := time.Now()

	status := models.SignalStatusConfirmed
	if req.Action == "reject" {
		status = models.SignalStatusRejected
	}

	_, err := r.db.Exec(ctx, `
		UPDATE citizen_signals
		SET status = $1, linked_ticket_id = $2,
			reviewed_by = $3, reviewed_at = $4
		WHERE id = $5
	`, status, req.LinkedTicketID, reviewerID, now, id)

	if err != nil {
		return nil, fmt.Errorf("error revisando señal: %w", err)
	}

	return r.GetSignalByID(ctx, id)
}