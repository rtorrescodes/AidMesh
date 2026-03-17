package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rtorrescodes/aidmesh/maps-service/internal/models"
	"github.com/rtorrescodes/aidmesh/maps-service/internal/repository"
)

type LayersHandler struct {
	repo *repository.MapsRepository
}

func NewLayersHandler(repo *repository.MapsRepository) *LayersHandler {
	return &LayersHandler{repo: repo}
}

func (h *LayersHandler) Create(c *gin.Context) {
	var req models.CreateLayerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	uid := userID.(string)

	layer, err := h.repo.CreateLayer(c.Request.Context(), req, &uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, layer)
}

func (h *LayersHandler) GetByEvent(c *gin.Context) {
	eventID := c.Query("event_id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "event_id requerido"})
		return
	}

	layers, err := h.repo.GetLayersByEvent(c.Request.Context(), eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if layers == nil {
		layers = []models.MapLayer{}
	}

	c.JSON(http.StatusOK, layers)
}

func (h *LayersHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	layer, err := h.repo.GetLayerByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, layer)
}