package handlers

import (
	"fmt"
	"strconv"

	"github.com/caregames/api/internal/services"
	"github.com/caregames/api/pkg/response"
	"github.com/gin-gonic/gin"
)

// RankingHandler handles HTTP requests for rankings.
type RankingHandler struct {
	svc *services.RankingService
}

// NewRankingHandler creates a new handler.
func NewRankingHandler(svc *services.RankingService) *RankingHandler {
	return &RankingHandler{svc: svc}
}

// GetGlobalRanking godoc
// @Summary      Get global ranking
// @Tags         rankings
// @Security     ApiKeyAuth
// @Produce      json
// @Param        limit query int false "Limit" default(20)
// @Param        offset query int false "Offset" default(0)
// @Success      200  {object} response.APIResponse
// @Router       /rankings/global [get]
func (h *RankingHandler) GetGlobalRanking(c *gin.Context) {
	userID := c.GetString("user_id") // From auth middleware

	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	ranking, err := h.svc.GetGlobalRanking(userID, limit, offset)
	if err != nil {
		fmt.Printf("GetGlobalRanking err: %v\n", err)
		response.InternalError(c, "Erro ao recuperar ranking global")
		return
	}

	response.OK(c, ranking, "Ranking global recuperado com sucesso")
}

// OptIn godoc
// @Summary      Opt in to global ranking
// @Tags         rankings
// @Security     ApiKeyAuth
// @Produce      json
// @Success      200  {object} response.APIResponse
// @Router       /rankings/global/opt-in [post]
func (h *RankingHandler) OptIn(c *gin.Context) {
	userID := c.GetString("user_id")

	if err := h.svc.SetOptIn(userID, true); err != nil {
		fmt.Printf("OptIn err: %v\n", err)
		if err.Error() == "bad_request: No active season available to opt in/out" {
			response.BadRequest(c, "NO_SEASON", "No active season available to opt in/out")
			return
		}
		response.InternalError(c, "Erro ao participar do ranking global")
		return
	}

	response.OK(c, nil, "Você agora está participando do ranking global")
}

// OptOut godoc
// @Summary      Opt out of global ranking
// @Tags         rankings
// @Security     ApiKeyAuth
// @Produce      json
// @Success      200  {object} response.APIResponse
// @Router       /rankings/global/opt-out [post]
func (h *RankingHandler) OptOut(c *gin.Context) {
	userID := c.GetString("user_id")

	if err := h.svc.SetOptIn(userID, false); err != nil {
		response.InternalError(c, "Erro ao sair do ranking global")
		return
	}

	response.OK(c, nil, "Você saiu do ranking global")
}
