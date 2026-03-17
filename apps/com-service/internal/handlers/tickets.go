package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rtorrescodes/aidmesh/com-service/internal/models"
	"github.com/rtorrescodes/aidmesh/com-service/internal/mqtt"
	"github.com/rtorrescodes/aidmesh/com-service/internal/repository"
	"fmt"
	"time"
)

type TicketsHandler struct {
	repo *repository.COMRepository
	mqtt *mqtt.MQTTClient
}

func NewTicketsHandler(repo *repository.COMRepository, mqtt *mqtt.MQTTClient) *TicketsHandler {
	return &TicketsHandler{repo: repo, mqtt: mqtt}
}

func (h *TicketsHandler) Create(c *gin.Context) {
	var req models.CreateTicketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	orgID, _ := c.Get("org_id")
	uid := userID.(string)
	var oid *string
	if orgID != nil {
		if s, ok := orgID.(string); ok {
			oid = &s
		}
	}

	ticket, err := h.repo.CreateTicket(c.Request.Context(), req, &uid, oid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Publicar en MQTT
	payload := models.TicketMQTTPayload{
		TicketID:  ticket.ID,
		EventID:   ticket.EventID,
		NeedType:  ticket.NeedType,
		Priority:  ticket.Priority,
		Latitude:  ticket.Latitude,
		Longitude: ticket.Longitude,
		Timestamp: time.Now(),
	}

	if ticket.ReportCount == 1 {
		// Ticket nuevo
		h.mqtt.Publish(mqtt.TopicTicketsNew, payload)
	} else {
		// Ticket duplicado — publicar update
		topic := fmt.Sprintf(mqtt.TopicTicketUpdate, ticket.ID)
		h.mqtt.Publish(topic, map[string]interface{}{
			"ticket_id":    ticket.ID,
			"report_count": ticket.ReportCount,
			"action":       "deduplicated",
		})
	}

	c.JSON(http.StatusCreated, ticket)
}

func (h *TicketsHandler) GetByEvent(c *gin.Context) {
	eventID := c.Query("event_id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "event_id requerido"})
		return
	}

	status := c.Query("status")
	var statusPtr *string
	if status != "" {
		statusPtr = &status
	}

	tickets, err := h.repo.GetTicketsByEvent(c.Request.Context(), eventID, statusPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if tickets == nil {
		tickets = []models.COMTicket{}
	}

	c.JSON(http.StatusOK, tickets)
}

func (h *TicketsHandler) GetByID(c *gin.Context) {
	ticket, err := h.repo.GetTicketByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ticket)
}

func (h *TicketsHandler) Update(c *gin.Context) {
	var req models.UpdateTicketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	uid := userID.(string)

	ticket, err := h.repo.UpdateTicket(c.Request.Context(), c.Param("id"), req, uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Publicar update en MQTT
	topic := fmt.Sprintf(mqtt.TopicTicketUpdate, ticket.ID)
	h.mqtt.Publish(topic, map[string]interface{}{
		"ticket_id":  ticket.ID,
		"status":     ticket.Status,
		"updated_by": uid,
		"timestamp":  time.Now(),
	})

	c.JSON(http.StatusOK, ticket)
}