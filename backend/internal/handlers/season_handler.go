package handlers

import (
	"strings"

	"github.com/caregames/api/internal/models"
	"github.com/caregames/api/internal/services"
	"github.com/caregames/api/pkg/response"
	"github.com/gin-gonic/gin"
)

// SeasonHandler handles HTTP requests for seasons.
type SeasonHandler struct {
	svc *services.SeasonService
}

// NewSeasonHandler creates a new handler.
func NewSeasonHandler(svc *services.SeasonService) *SeasonHandler {
	return &SeasonHandler{svc: svc}
}

// CreateSeason godoc
// @Summary      Create a new season
// @Tags         seasons
// @Security     ApiKeyAuth
// @Accept       json
// @Produce      json
// @Param        request body models.SeasonCreate true "Season properties"
// @Success      201  {object} response.APIResponse
// @Router       /seasons [post]
func (h *SeasonHandler) CreateSeason(c *gin.Context) {
	var req models.SeasonCreate
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VALIDATION_ERROR", err.Error())
		return
	}

	userID := c.GetString("user_id")
	season, err := h.svc.CreateSeason(req, userID)
	if err != nil {
		if strings.HasPrefix(err.Error(), "bad_request") {
			response.BadRequest(c, "INVALID_DATES", "A data de início deve ser antes da data de fim")
			return
		}
		response.InternalError(c, "Erro ao criar temporada")
		return
	}

	response.Created(c, season, "Temporada criada com sucesso")
}

// ListSeasons godoc
// @Summary      List all seasons
// @Tags         seasons
// @Security     ApiKeyAuth
// @Produce      json
// @Success      200  {object} response.APIResponse
// @Router       /seasons [get]
func (h *SeasonHandler) ListSeasons(c *gin.Context) {
	seasons, err := h.svc.List()
	if err != nil {
		response.InternalError(c, "Erro ao listar temporadas")
		return
	}
	response.OK(c, seasons, "Temporadas recuperadas")
}

// GetActiveSeason godoc
// @Summary      Get active season
// @Tags         seasons
// @Security     ApiKeyAuth
// @Produce      json
// @Success      200  {object} response.APIResponse
// @Router       /seasons/active [get]
func (h *SeasonHandler) GetActiveSeason(c *gin.Context) {
	season, err := h.svc.GetActive()
	if err != nil {
		response.InternalError(c, "Erro ao buscar temporada ativa")
		return
	}
	if season == nil {
		response.NotFound(c, "Nenhuma temporada ativa encontrada")
		return
	}
	response.OK(c, season, "Temporada ativa recuperada")
}

// GetSeason godoc
// @Summary      Get season by ID
// @Tags         seasons
// @Security     ApiKeyAuth
// @Produce      json
// @Param        id path string true "Season ID"
// @Success      200  {object} response.APIResponse
// @Router       /seasons/{id} [get]
func (h *SeasonHandler) GetSeason(c *gin.Context) {
	id := c.Param("id")
	season, err := h.svc.GetByID(id)
	if err != nil {
		if strings.HasPrefix(err.Error(), "not_found") {
			response.NotFound(c, "Temporada não encontrada")
			return
		}
		response.InternalError(c, "Erro ao buscar temporada")
		return
	}
	response.OK(c, season, "Temporada recuperada")
}

// UpdateSeason godoc
// @Summary      Update a season
// @Tags         seasons
// @Security     ApiKeyAuth
// @Accept       json
// @Produce      json
// @Param        id path string true "Season ID"
// @Param        request body models.SeasonCreate true "Season properties"
// @Success      200  {object} response.APIResponse
// @Router       /seasons/{id} [put]
func (h *SeasonHandler) UpdateSeason(c *gin.Context) {
	id := c.Param("id")
	var req models.SeasonCreate
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VALIDATION_ERROR", err.Error())
		return
	}

	season, err := h.svc.UpdateSeason(id, req)
	if err != nil {
		if strings.HasPrefix(err.Error(), "not_found") {
			response.NotFound(c, "Temporada não encontrada")
			return
		}
		if strings.HasPrefix(err.Error(), "bad_request") {
			response.BadRequest(c, "INVALID_DATES", "A data de início deve ser antes da data de fim")
			return
		}
		response.InternalError(c, "Erro ao atualizar temporada")
		return
	}

	response.OK(c, season, "Temporada atualizada com sucesso")
}

// DeleteSeason godoc
// @Summary      Delete a season
// @Tags         seasons
// @Security     ApiKeyAuth
// @Produce      json
// @Param        id path string true "Season ID"
// @Success      200  {object} response.APIResponse
// @Router       /seasons/{id} [delete]
func (h *SeasonHandler) DeleteSeason(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.DeleteSeason(id); err != nil {
		response.InternalError(c, "Erro ao deletar temporada")
		return
	}
	response.OK(c, nil, "Temporada deletada com sucesso")
}

// ActivateSeason godoc
// @Summary      Activate a season
// @Tags         seasons
// @Security     ApiKeyAuth
// @Produce      json
// @Param        id path string true "Season ID"
// @Success      200  {object} response.APIResponse
// @Router       /seasons/{id}/activate [post]
func (h *SeasonHandler) ActivateSeason(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.ActivateSeason(id); err != nil {
		response.InternalError(c, "Erro ao ativar temporada")
		return
	}
	response.OK(c, nil, "Temporada ativada com sucesso")
}
