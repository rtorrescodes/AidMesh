package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rtorrescodes/aidmesh/com-service/internal/models"
	"github.com/rtorrescodes/aidmesh/com-service/internal/mqtt"
	"github.com/rtorrescodes/aidmesh/com-service/internal/repository"
)

type SignalsHandler struct {
	repo *repository.COMRepository
	mqtt *mqtt.MQTTClient
}

func NewSignalsHandler(repo *repository.COMRepository, mqtt *mqtt.MQTTClient) *SignalsHandler {
	return &SignalsHandler{repo: repo, mqtt: mqtt}
}

// Endpoint público — no requiere JWT
func (h *SignalsHandler) Create(c *gin.Context) {
	var req models.CreateSignalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	signal, err := h.repo.CreateSignal(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Publicar señal cruda en MQTT para que operadores la vean
	h.mqtt.Publish(mqtt.TopicCitizenSignalRaw, map[string]interface{}{
		"signal_id":   signal.ID,
		"event_id":    signal.EventID,
		"raw_message": signal.RawMessage,
		"latitude":    signal.Latitude,
		"longitude":   signal.Longitude,
	})

	c.JSON(http.StatusCreated, gin.H{
		"id":      signal.ID,
		"message": "Señal recibida. Será revisada por un operador.",
		"status":  signal.Status,
	})
}

func (h *SignalsHandler) GetPending(c *gin.Context) {
	eventID := c.Query("event_id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "event_id requerido"})
		return
	}

	signals, err := h.repo.GetPendingSignals(c.Request.Context(), eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if signals == nil {
		signals = []models.CitizenSignal{}
	}

	c.JSON(http.StatusOK, signals)
}

func (h *SignalsHandler) Review(c *gin.Context) {
	var req models.ReviewSignalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Action != "confirm" && req.Action != "reject" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "action debe ser 'confirm' o 'reject'"})
		return
	}

	userID, _ := c.Get("user_id")
	uid := userID.(string)

	signal, err := h.repo.ReviewSignal(c.Request.Context(), c.Param("id"), req, uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, signal)
}