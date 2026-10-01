package handlers

import (
	"strings"

	"github.com/caregames/api/internal/services"
	"github.com/caregames/api/pkg/response"
	"github.com/gin-gonic/gin"
)

// ChallengeHandler handles HTTP requests for challenge endpoints.
type ChallengeHandler struct {
	svc       *services.ChallengeService
	pointsSvc *services.PointsService
}

// NewChallengeHandler creates a new ChallengeHandler.
func NewChallengeHandler(svc *services.ChallengeService, pointsSvc *services.PointsService) *ChallengeHandler {
	return &ChallengeHandler{svc: svc, pointsSvc: pointsSvc}
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

// UpdateProgress godoc
// @Summary      Update progress on an active challenge
// @Tags         challenges
// @Security     ApiKeyAuth
// @Produce      json
// @Param        id   path string true "Challenge ID"
// @Param        body body object true "Progress Data"
// @Success      200  {object} response.APIResponse
// @Router       /challenges/{id}/progress [put]
func (h *ChallengeHandler) UpdateProgress(c *gin.Context) {
	userID := c.GetString("user_id")
	challengeID := c.Param("id")

	var req struct {
		CurrentValue float64 `json:"current_value"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VALIDATION_ERROR", err.Error())
		return
	}

	if err := h.svc.UpdateProgress(userID, challengeID, req.CurrentValue); err != nil {
		if strings.HasPrefix(err.Error(), "not_found") {
			response.NotFound(c, "Desafio não encontrado ou não está em progresso")
			return
		}
		response.InternalError(c, "Erro ao atualizar progresso")
		return
	}

	response.OK(c, nil, "Progresso atualizado")
}

// CompleteChallenge godoc
// @Summary      Mark a challenge as completed and receive points
// @Tags         challenges
// @Security     ApiKeyAuth
// @Produce      json
// @Param        id   path string true "Challenge ID"
// @Success      200  {object} response.APIResponse
// @Router       /challenges/{id}/complete [post]
func (h *ChallengeHandler) CompleteChallenge(c *gin.Context) {
	userID := c.GetString("user_id")
	challengeID := c.Param("id")

	// We retrieve the points service from context since we injected it in router, 
	// or we can pass it to the handler struct. Passing to struct is cleaner.
	pts, err := h.svc.CompleteChallenge(userID, challengeID, h.pointsSvc)
	if err != nil {
		if strings.HasPrefix(err.Error(), "not_found") {
			response.NotFound(c, "Desafio não encontrado")
			return
		}
		if strings.HasPrefix(err.Error(), "bad_request") {
			response.BadRequest(c, "INVALID_STATE", err.Error())
			return
		}
		response.InternalError(c, "Erro ao concluir desafio")
		return
	}

	response.OK(c, gin.H{
		"points_awarded": pts,
	}, "Desafio concluído!")
}
