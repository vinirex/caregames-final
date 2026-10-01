package handlers

import (
	"strings"

	"github.com/caregames/api/internal/services"
	"github.com/caregames/api/pkg/response"
	"github.com/gin-gonic/gin"
)

// ChallengeHandler handles HTTP requests for challenge endpoints.
type ChallengeHandler struct {
	svc *services.ChallengeService
}

// NewChallengeHandler creates a new ChallengeHandler.
func NewChallengeHandler(svc *services.ChallengeService) *ChallengeHandler {
	return &ChallengeHandler{svc: svc}
}

// ListActive godoc
// @Summary      List all active challenges with user progress
// @Tags         challenges
// @Security     ApiKeyAuth
// @Produce      json
// @Success      200  {object} response.APIResponse
// @Router       /challenges [get]
func (h *ChallengeHandler) ListActive(c *gin.Context) {
	userID := c.GetString("user_id")

	challenges, err := h.svc.ListActiveForUser(userID)
	if err != nil {
		response.InternalError(c, "Erro ao listar desafios")
		return
	}

	response.OK(c, challenges, "")
}

// AcceptChallenge godoc
// @Summary      Accept and start tracking a challenge
// @Tags         challenges
// @Security     ApiKeyAuth
// @Produce      json
// @Param        id   path string true "Challenge ID"
// @Success      200  {object} response.APIResponse
// @Failure      404  {object} response.APIResponse
// @Failure      409  {object} response.APIResponse
// @Router       /challenges/{id}/accept [post]
func (h *ChallengeHandler) AcceptChallenge(c *gin.Context) {
	userID := c.GetString("user_id")
	challengeID := c.Param("id")

	if err := h.svc.AcceptChallenge(userID, challengeID); err != nil {
		if strings.HasPrefix(err.Error(), "not_found") {
			response.NotFound(c, "Desafio não encontrado ou inativo")
			return
		}
		if strings.HasPrefix(err.Error(), "conflict") {
			response.Conflict(c, "CHALLENGE_ALREADY_ACCEPTED", "Você já está participando deste desafio")
			return
		}
		response.InternalError(c, "Erro ao aceitar desafio")
		return
	}

	response.OK(c, nil, "Desafio aceito com sucesso")
}
