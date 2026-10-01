package handlers

import (
	"strings"

	"github.com/caregames/api/internal/services"
	"github.com/caregames/api/pkg/response"
	"github.com/gin-gonic/gin"
)

// AuthHandler handles HTTP requests for auth endpoints.
type AuthHandler struct {
	svc *services.AuthService
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(svc *services.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

// Register godoc
// @Summary      Register a new user
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body body services.RegisterInput true "Registration payload"
// @Success      201  {object} response.APIResponse
// @Failure      400  {object} response.APIResponse
// @Failure      409  {object} response.APIResponse
// @Router       /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var input services.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "VALIDATION_ERROR", err.Error())
		return
	}

	result, err := h.svc.Register(input)
	if err != nil {
		code, msg := parseServiceError(err)
		if code == "EMAIL_TAKEN" {
			response.Conflict(c, code, msg)
		} else {
			response.BadRequest(c, code, msg)
		}
		return
	}

	response.Created(c, result, result.Message)
}

// Login godoc
// @Summary      Login and receive an API key
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body body services.LoginInput true "Login credentials"
// @Success      200  {object} response.APIResponse
// @Failure      401  {object} response.APIResponse
// @Router       /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var input services.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "VALIDATION_ERROR", err.Error())
		return
	}

	result, err := h.svc.Login(input)
	if err != nil {
		response.Unauthorized(c, "E-mail ou senha inválidos")
		return
	}

	response.OK(c, gin.H{
		"api_key": result.APIKey,
		"user_id": result.User.ID,
		"email":   result.User.Email,
		"role":    result.User.Role,
	}, "Login realizado com sucesso")
}

// Me godoc
// @Summary      Get authenticated user info
// @Tags         auth
// @Security     ApiKeyAuth
// @Produce      json
// @Success      200  {object} response.APIResponse
// @Failure      401  {object} response.APIResponse
// @Router       /auth/me [get]
func (h *AuthHandler) Me(c *gin.Context) {
	userID := c.GetString("user_id")
	user, err := h.svc.GetMe(userID)
	if err != nil || user == nil {
		response.NotFound(c, "Usuário não encontrado")
		return
	}
	response.OK(c, user, "")
}

// parseServiceError converts a service error into an HTTP-friendly code/message pair.
func parseServiceError(err error) (string, string) {
	msg := err.Error()
	if idx := strings.Index(msg, ": "); idx != -1 {
		parts := strings.SplitN(msg, ": ", 2)
		code := strings.ToUpper(strings.ReplaceAll(parts[0], "_", "_"))
		return code, parts[1]
	}
	return "SERVICE_ERROR", msg
}
