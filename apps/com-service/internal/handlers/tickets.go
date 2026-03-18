package handlers

import (
"fmt"
"net/http"
"time"

"github.com/gin-gonic/gin"
"github.com/rtorrescodes/aidmesh/com-service/internal/models"
"github.com/rtorrescodes/aidmesh/com-service/internal/mqtt"
"github.com/rtorrescodes/aidmesh/com-service/internal/repository"
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
payload := models.TicketMQTTPayload{
TicketID:  ticket.ID,
EventID:   ticket.EventID,
NeedType:  ticket.NeedType,
Priority:  ticket.Priority,
Status:    ticket.Status,
Latitude:  ticket.Latitude,
Longitude: ticket.Longitude,
Timestamp: time.Now(),
}
if ticket.ReportCount == 1 {
h.mqtt.Publish(mqtt.TopicTicketsNew, payload)
} else {
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
topic := fmt.Sprintf(mqtt.TopicTicketUpdate, ticket.ID)
h.mqtt.Publish(topic, map[string]interface{}{
"ticket_id":  ticket.ID,
"status":     ticket.Status,
"updated_by": uid,
"timestamp":  time.Now(),
})
c.JSON(http.StatusOK, ticket)
}

func (h *TicketsHandler) Assign(c *gin.Context) {
var req models.AssignTicketRequest
if err := c.ShouldBindJSON(&req); err != nil {
c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
return
}
assignedByRaw, _ := c.Get("user_id")
assignedBy := assignedByRaw.(string)
ticket, err := h.repo.AssignTicket(c.Request.Context(), c.Param("id"), req.AssignedTo, assignedBy)
if err != nil {
c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
return
}
h.mqtt.Publish(mqtt.TopicTicketsAssigned, models.TicketAssignedPayload{
TicketID:   ticket.ID,
EventID:    ticket.EventID,
AssignedTo: req.AssignedTo,
AssignedBy: assignedBy,
AssignedAt: *ticket.AssignedAt,
})
c.JSON(http.StatusOK, ticket)
}

func (h *TicketsHandler) GetAssignableUsers(c *gin.Context) {
eventID := c.Query("event_id")
if eventID == "" {
c.JSON(http.StatusBadRequest, gin.H{"error": "event_id requerido"})
return
}
users, err := h.repo.GetAssignableUsers(c.Request.Context(), eventID)
if err != nil {
c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
return
}
if users == nil {
users = []models.AssignableUser{}
}
c.JSON(http.StatusOK, users)
}
