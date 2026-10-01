package handlers

import (
	"github.com/caregames/api/internal/services"
	"github.com/caregames/api/pkg/response"
	"github.com/gin-gonic/gin"
)

// ProfileHandler handles HTTP requests for profile endpoints.
type ProfileHandler struct {
	svc *services.ProfileService
}

// NewProfileHandler creates a new ProfileHandler.
func NewProfileHandler(svc *services.ProfileService) *ProfileHandler {
	return &ProfileHandler{svc: svc}
}

// GetProfile godoc
// @Summary      Get authenticated user's profile
// @Tags         profile
// @Security     ApiKeyAuth
// @Produce      json
// @Success      200  {object} response.APIResponse
// @Router       /profile [get]
func (h *ProfileHandler) GetProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	profile, err := h.svc.GetProfile(userID)
	if err != nil {
		response.InternalError(c, "Erro ao carregar perfil")
		return
	}
	response.OK(c, profile, "")
}

// UpdateProfile godoc
// @Summary      Update authenticated user's profile
// @Tags         profile
// @Security     ApiKeyAuth
// @Accept       json
// @Produce      json
// @Param        body body services.UpdateProfileInput true "Profile data"
// @Success      200  {object} response.APIResponse
// @Failure      400  {object} response.APIResponse
// @Router       /profile [put]
func (h *ProfileHandler) UpdateProfile(c *gin.Context) {
	userID := c.GetString("user_id")

	var input services.UpdateProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "VALIDATION_ERROR", err.Error())
		return
	}

	if err := h.svc.UpdateProfile(userID, input); err != nil {
		code, msg := parseServiceError(err)
		response.BadRequest(c, code, msg)
		return
	}

	// Return updated profile
	profile, err := h.svc.GetProfile(userID)
	if err != nil {
		response.InternalError(c, "Perfil atualizado, mas erro ao recarregar")
		return
	}
	response.OK(c, profile, "Perfil atualizado com sucesso")
}
