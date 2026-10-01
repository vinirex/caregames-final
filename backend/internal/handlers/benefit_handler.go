package handlers

import (
	"strings"

	"github.com/caregames/api/internal/services"
	"github.com/caregames/api/pkg/response"
	"github.com/gin-gonic/gin"
)

// BenefitHandler handles HTTP requests for benefit endpoints.
type BenefitHandler struct {
	svc *services.BenefitService
}

// NewBenefitHandler creates a new BenefitHandler.
func NewBenefitHandler(svc *services.BenefitService) *BenefitHandler {
	return &BenefitHandler{svc: svc}
}

// ListActive godoc
// @Summary      List active benefits
// @Tags         benefits
// @Security     ApiKeyAuth
// @Produce      json
// @Success      200  {object} response.APIResponse
// @Router       /benefits [get]
func (h *BenefitHandler) ListActive(c *gin.Context) {
	benefits, err := h.svc.ListActive()
	if err != nil {
		response.InternalError(c, "Erro ao buscar benefícios")
		return
	}
	response.OK(c, benefits, "Benefícios recuperados")
}

// GetByID godoc
// @Summary      Get a benefit by ID
// @Tags         benefits
// @Security     ApiKeyAuth
// @Produce      json
// @Param        id   path string true "Benefit ID"
// @Success      200  {object} response.APIResponse
// @Router       /benefits/{id} [get]
func (h *BenefitHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	b, err := h.svc.GetByID(id)
	if err != nil {
		response.InternalError(c, "Erro ao buscar benefício")
		return
	}
	if b == nil {
		response.NotFound(c, "Benefício não encontrado")
		return
	}
	response.OK(c, b, "Benefício recuperado")
}

// RedeemBenefit godoc
// @Summary      Redeem a benefit using points
// @Tags         benefits
// @Security     ApiKeyAuth
// @Produce      json
// @Param        id   path string true "Benefit ID"
// @Success      200  {object} response.APIResponse
// @Router       /benefits/{id}/redeem [post]
func (h *BenefitHandler) RedeemBenefit(c *gin.Context) {
	userID := c.GetString("user_id")
	benefitID := c.Param("id")

	rdm, err := h.svc.RedeemBenefit(userID, benefitID)
	if err != nil {
		if strings.HasPrefix(err.Error(), "not_found") {
			response.NotFound(c, "Benefício não encontrado ou inativo")
			return
		}
		if strings.HasPrefix(err.Error(), "conflict") {
			response.Conflict(c, "OUT_OF_STOCK", "Benefício esgotado")
			return
		}
		if strings.Contains(err.Error(), "insufficient_points") {
			response.BadRequest(c, "INSUFFICIENT_POINTS", "Pontos insuficientes para resgatar este benefício")
			return
		}
		response.InternalError(c, "Erro ao resgatar benefício")
		return
	}

	response.OK(c, gin.H{
		"redemption_id": rdm.ID,
		"voucher_code":  rdm.VoucherCode,
		"points_spent":  rdm.PointsSpent,
	}, "Benefício resgatado com sucesso!")
}

// ListRedemptions godoc
// @Summary      List user's past redemptions
// @Tags         benefits
// @Security     ApiKeyAuth
// @Produce      json
// @Success      200  {object} response.APIResponse
// @Router       /benefits/redemptions [get]
func (h *BenefitHandler) ListRedemptions(c *gin.Context) {
	userID := c.GetString("user_id")
	rdms, err := h.svc.ListRedemptions(userID)
	if err != nil {
		response.InternalError(c, "Erro ao buscar resgates")
		return
	}
	response.OK(c, rdms, "Resgates recuperados")
}
