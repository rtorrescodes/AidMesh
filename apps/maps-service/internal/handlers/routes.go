package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rtorrescodes/aidmesh/maps-service/internal/models"
	"github.com/rtorrescodes/aidmesh/maps-service/internal/repository"
)

type RoutesHandler struct {
	repo *repository.MapsRepository
}

func NewRoutesHandler(repo *repository.MapsRepository) *RoutesHandler {
	return &RoutesHandler{repo: repo}
}

func (h *RoutesHandler) Create(c *gin.Context) {
	var req models.CreateRouteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	uid := userID.(string)

	route, err := h.repo.CreateRoute(c.Request.Context(), req, &uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, route)
}

func (h *RoutesHandler) GetByEvent(c *gin.Context) {
	eventID := c.Query("event_id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "event_id requerido"})
		return
	}

	routes, err := h.repo.GetRoutesByEvent(c.Request.Context(), eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if routes == nil {
		routes = []models.EmergencyRoute{}
	}

	c.JSON(http.StatusOK, routes)
}

func (h *RoutesHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	route, err := h.repo.GetRouteByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, route)
}