package handlers

import (
	"fmt"
	"strings"

	"github.com/caregames/api/internal/models"
	"github.com/caregames/api/internal/services"
	"github.com/caregames/api/pkg/response"
	"github.com/gin-gonic/gin"
)

// GroupHandler handles group endpoints.
type GroupHandler struct {
	svc *services.GroupService
}

// NewGroupHandler creates a new handler.
func NewGroupHandler(svc *services.GroupService) *GroupHandler {
	return &GroupHandler{svc: svc}
}

// ListUserGroups godoc
// @Summary      List user groups
// @Tags         groups
// @Security     ApiKeyAuth
// @Produce      json
// @Success      200  {object} response.APIResponse
// @Router       /groups [get]
func (h *GroupHandler) ListUserGroups(c *gin.Context) {
	userID := c.GetString("user_id")
	groups, err := h.svc.ListUserGroups(userID)
	if err != nil {
		response.InternalError(c, "Erro ao buscar grupos")
		return
	}
	response.OK(c, groups, "Grupos recuperados")
}

// CreateGroup godoc
// @Summary      Create a new group
// @Tags         groups
// @Security     ApiKeyAuth
// @Produce      json
// @Param        body body models.Group true "Group Data"
// @Success      200  {object} response.APIResponse
// @Router       /groups [post]
func (h *GroupHandler) CreateGroup(c *gin.Context) {
	userID := c.GetString("user_id")
	var req models.Group
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VALIDATION_ERROR", err.Error())
		return
	}

	g, err := h.svc.CreateGroup(userID, &req)
	if err != nil {
		response.InternalError(c, "Erro ao criar grupo")
		return
	}

	response.OK(c, g, "Grupo criado com sucesso")
}

// JoinGroup godoc
// @Summary      Join a group via invite code
// @Tags         groups
// @Security     ApiKeyAuth
// @Produce      json
// @Param        body body object true "Invite Code"
// @Success      200  {object} response.APIResponse
// @Router       /groups/join [post]
func (h *GroupHandler) JoinGroup(c *gin.Context) {
	userID := c.GetString("user_id")
	var req struct {
		InviteCode string `json:"invite_code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VALIDATION_ERROR", err.Error())
		return
	}

	if err := h.svc.JoinGroup(userID, req.InviteCode); err != nil {
		if strings.HasPrefix(err.Error(), "not_found") {
			response.NotFound(c, "Código de convite inválido")
			return
		}
		response.InternalError(c, "Erro ao entrar no grupo")
		return
	}

	response.OK(c, nil, "Entrou no grupo com sucesso")
}

// GetRanking godoc
// @Summary      Get group ranking
// @Tags         groups
// @Security     ApiKeyAuth
// @Produce      json
// @Param        id path string true "Group ID"
// @Success      200  {object} response.APIResponse
// @Router       /groups/{id}/ranking [get]
func (h *GroupHandler) GetRanking(c *gin.Context) {
	groupID := c.Param("id")
	ranking, err := h.svc.GetRanking(groupID)
	if err != nil {
		fmt.Printf("GetRanking err: %v\n", err)
		response.InternalError(c, "Erro ao buscar ranking do grupo")
		return
	}

	response.OK(c, gin.H{"ranking": ranking}, "Ranking do grupo recuperado")
}

// LeaveGroup godoc
// @Summary      Leave a group
// @Tags         groups
// @Security     ApiKeyAuth
// @Produce      json
// @Param        id path string true "Group ID"
// @Success      200  {object} response.APIResponse
// @Router       /groups/{id}/leave [post]
func (h *GroupHandler) LeaveGroup(c *gin.Context) {
	userID := c.GetString("user_id")
	groupID := c.Param("id")

	if err := h.svc.LeaveGroup(userID, groupID); err != nil {
		response.InternalError(c, "Erro ao sair do grupo")
		return
	}

	response.OK(c, nil, "Saiu do grupo")
}
