package handlers

import (
	"strings"

	"github.com/caregames/api/internal/models"
	"github.com/caregames/api/internal/services"
	"github.com/caregames/api/pkg/response"
	"github.com/gin-gonic/gin"
)

// HealthHandler handles health telemetry requests.
type HealthHandler struct {
	svc *services.HealthService
}

// NewHealthHandler creates a new HealthHandler.
func NewHealthHandler(svc *services.HealthService) *HealthHandler {
	return &HealthHandler{svc: svc}
}

// SyncData godoc
// @Summary      Upload health data from a wearable/app
// @Tags         health
// @Security     ApiKeyAuth
// @Accept       json
// @Produce      json
// @Param        body body models.HealthSyncRecord true "Health Data"
// @Success      200  {object} response.APIResponse
// @Router       /health/sync [post]
func (h *HealthHandler) SyncData(c *gin.Context) {
	userID := c.GetString("user_id")

	var req models.HealthSyncRecord
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VALIDATION_ERROR", err.Error())
		return
	}

	if err := h.svc.SyncData(userID, &req); err != nil {
		response.InternalError(c, "Erro ao sincronizar dados de saúde")
		return
	}

	response.OK(c, nil, "Sincronização concluída com sucesso")
}

// ListRecords godoc
// @Summary      Get health history
// @Tags         health
// @Security     ApiKeyAuth
// @Produce      json
// @Success      200  {object} response.APIResponse
// @Router       /health/records [get]
func (h *HealthHandler) ListRecords(c *gin.Context) {
	userID := c.GetString("user_id")

	records, err := h.svc.ListRecords(userID)
	if err != nil {
		response.InternalError(c, "Erro ao buscar histórico")
		return
	}

	response.OK(c, records, "Histórico recuperado")
}

// GetRecordByDate godoc
// @Summary      Get health data for a specific date
// @Tags         health
// @Security     ApiKeyAuth
// @Produce      json
// @Param        date path string true "Date YYYY-MM-DD"
// @Success      200  {object} response.APIResponse
// @Router       /health/records/{date} [get]
func (h *HealthHandler) GetRecordByDate(c *gin.Context) {
	userID := c.GetString("user_id")
	dateStr := c.Param("date")

	rec, err := h.svc.GetRecordByDate(userID, dateStr)
	if err != nil {
		if strings.HasPrefix(err.Error(), "bad_request") {
			response.BadRequest(c, "INVALID_DATE", err.Error())
			return
		}
		response.InternalError(c, "Erro ao buscar registro")
		return
	}

	if rec == nil {
		response.NotFound(c, "Nenhum registro encontrado para a data")
		return
	}

	response.OK(c, rec, "Registro recuperado")
}
