package handlers

import (
	"strings"

	"github.com/caregames/api/internal/services"
	"github.com/caregames/api/pkg/pagination"
	"github.com/caregames/api/pkg/response"
	"github.com/gin-gonic/gin"
)

// PointsHandler handles HTTP requests for points endpoints.
type PointsHandler struct {
	svc *services.PointsService
}

// NewPointsHandler creates a new PointsHandler.
func NewPointsHandler(svc *services.PointsService) *PointsHandler {
	return &PointsHandler{svc: svc}
}

// GetBalance godoc
// @Summary      Get current points balance
// @Tags         points
// @Security     ApiKeyAuth
// @Produce      json
// @Success      200  {object} response.APIResponse
// @Router       /points [get]
func (h *PointsHandler) GetBalance(c *gin.Context) {
	userID := c.GetString("user_id")
	pts, err := h.svc.GetBalance(userID)
	if err != nil {
		response.InternalError(c, "Erro ao carregar pontos")
		return
	}
	response.OK(c, pts, "")
}

// ListTransactions godoc
// @Summary      Get paginated point transaction history
// @Tags         points
// @Security     ApiKeyAuth
// @Produce      json
// @Param        page  query int false "Page number (default 1)"
// @Param        limit query int false "Items per page (default 20, max 100)"
// @Success      200   {object} response.APIResponse
// @Router       /points/history [get]
func (h *PointsHandler) ListTransactions(c *gin.Context) {
	userID := c.GetString("user_id")

	var p pagination.Params
	if err := c.ShouldBindQuery(&p); err != nil {
		response.BadRequest(c, "VALIDATION_ERROR", err.Error())
		return
	}
	p.Normalize()

	txs, total, err := h.svc.ListTransactions(userID, p.Limit, p.Offset())
	if err != nil {
		response.InternalError(c, "Erro ao carregar histórico")
		return
	}

	response.OKPaginated(c, txs, response.Pagination{
		Page:       p.Page,
		Limit:      p.Limit,
		Total:      total,
		TotalPages: pagination.TotalPages(total, p.Limit),
	})
}

// addPointsInput is the request body for the admin add-points endpoint.
type addPointsInput struct {
	Amount int    `json:"amount" binding:"required,min=1"`
	Reason string `json:"reason" binding:"required"`
}

// AddPoints godoc
// @Summary      Manually add points (admin only)
// @Tags         points
// @Security     ApiKeyAuth
// @Accept       json
// @Produce      json
// @Param        body body addPointsInput true "Points to add"
// @Success      200  {object} response.APIResponse
// @Failure      403  {object} response.APIResponse
// @Router       /points/add [post]
func (h *PointsHandler) AddPoints(c *gin.Context) {
	userID := c.GetString("user_id") // target is the authenticated user (admin adding to themselves or via different route)

	var input addPointsInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "VALIDATION_ERROR", err.Error())
		return
	}

	newBalance, err := h.svc.AddPoints(userID, input.Amount, input.Reason, "", "manual")
	if err != nil {
		response.InternalError(c, "Erro ao adicionar pontos")
		return
	}

	response.OK(c, gin.H{"new_balance": newBalance}, "Pontos adicionados com sucesso")
}

// spendPointsInput is the request body for spending points.
type spendPointsInput struct {
	Amount int    `json:"amount" binding:"required,min=1"`
	Reason string `json:"reason" binding:"required"`
}

// SpendPoints godoc
// @Summary      Manually spend points
// @Tags         points
// @Security     ApiKeyAuth
// @Accept       json
// @Produce      json
// @Param        body body spendPointsInput true "Points to spend"
// @Success      200  {object} response.APIResponse
// @Failure      422  {object} response.APIResponse
// @Router       /points/spend [post]
func (h *PointsHandler) SpendPoints(c *gin.Context) {
	userID := c.GetString("user_id")

	var input spendPointsInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "VALIDATION_ERROR", err.Error())
		return
	}

	newBalance, err := h.svc.SpendPoints(userID, input.Amount, input.Reason, "", "manual")
	if err != nil {
		if strings.HasPrefix(err.Error(), "insufficient_points") {
			response.UnprocessableEntity(c, "INSUFFICIENT_POINTS", "Saldo de pontos insuficiente")
			return
		}
		response.InternalError(c, "Erro ao gastar pontos")
		return
	}

	response.OK(c, gin.H{"new_balance": newBalance}, "Pontos gastos com sucesso")
}
