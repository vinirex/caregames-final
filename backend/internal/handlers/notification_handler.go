package handlers

import (
	"github.com/caregames/api/internal/services"
	"github.com/caregames/api/pkg/response"
	"github.com/gin-gonic/gin"
)

// NotificationHandler handles notification endpoints.
type NotificationHandler struct {
	svc *services.NotificationService
}

// NewNotificationHandler creates a new handler.
func NewNotificationHandler(svc *services.NotificationService) *NotificationHandler {
	return &NotificationHandler{svc: svc}
}

// List godoc
// @Summary      List notifications
// @Tags         notifications
// @Security     ApiKeyAuth
// @Produce      json
// @Success      200  {object} response.APIResponse
// @Router       /notifications [get]
func (h *NotificationHandler) List(c *gin.Context) {
	userID := c.GetString("user_id")
	notifs, unread, err := h.svc.List(userID)
	if err != nil {
		response.InternalError(c, "Erro ao buscar notificações")
		return
	}
	response.OK(c, gin.H{"notifications": notifs, "unread_count": unread}, "Notificações recuperadas")
}

// GetUnreadCount godoc
// @Summary      Get unread notifications count
// @Tags         notifications
// @Security     ApiKeyAuth
// @Produce      json
// @Success      200  {object} response.APIResponse
// @Router       /notifications/unread-count [get]
func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	userID := c.GetString("user_id")
	count, err := h.svc.GetUnreadCount(userID)
	if err != nil {
		response.InternalError(c, "Erro ao buscar contagem")
		return
	}
	response.OK(c, gin.H{"unread_count": count}, "Contagem recuperada")
}

// MarkAsRead godoc
// @Summary      Mark notification as read
// @Tags         notifications
// @Security     ApiKeyAuth
// @Produce      json
// @Param        id path string true "Notification ID"
// @Success      200  {object} response.APIResponse
// @Router       /notifications/{id}/read [put]
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	userID := c.GetString("user_id")
	id := c.Param("id")
	if err := h.svc.MarkAsRead(id, userID); err != nil {
		response.InternalError(c, "Erro ao marcar como lida")
		return
	}
	response.OK(c, nil, "Notificação marcada como lida")
}

// MarkAllAsRead godoc
// @Summary      Mark all notifications as read
// @Tags         notifications
// @Security     ApiKeyAuth
// @Produce      json
// @Success      200  {object} response.APIResponse
// @Router       /notifications/read-all [put]
func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	userID := c.GetString("user_id")
	if err := h.svc.MarkAllAsRead(userID); err != nil {
		response.InternalError(c, "Erro ao marcar todas como lidas")
		return
	}
	response.OK(c, nil, "Todas as notificações marcadas como lidas")
}

// Delete godoc
// @Summary      Delete a notification
// @Tags         notifications
// @Security     ApiKeyAuth
// @Produce      json
// @Param        id path string true "Notification ID"
// @Success      200  {object} response.APIResponse
// @Router       /notifications/{id} [delete]
func (h *NotificationHandler) Delete(c *gin.Context) {
	userID := c.GetString("user_id")
	id := c.Param("id")
	if err := h.svc.Delete(id, userID); err != nil {
		response.InternalError(c, "Erro ao deletar notificação")
		return
	}
	response.OK(c, nil, "Notificação deletada")
}

// DeleteRead godoc
// @Summary      Delete all read notifications
// @Tags         notifications
// @Security     ApiKeyAuth
// @Produce      json
// @Success      200  {object} response.APIResponse
// @Router       /notifications/read [delete]
func (h *NotificationHandler) DeleteRead(c *gin.Context) {
	userID := c.GetString("user_id")
	if err := h.svc.DeleteRead(userID); err != nil {
		response.InternalError(c, "Erro ao deletar lidas")
		return
	}
	response.OK(c, nil, "Notificações lidas deletadas")
}
