package middleware

import (
	"strings"

	"github.com/caregames/api/internal/repositories"
	"github.com/caregames/api/pkg/response"
	"github.com/gin-gonic/gin"
)

// APIKeyHeader is the expected request header name.
const APIKeyHeader = "X-API-Key"

// Auth returns a Gin middleware that validates the X-API-Key header.
// On success it injects "user_id" and "role" into the context.
func Auth(userRepo *repositories.UserRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.GetHeader(APIKeyHeader)
		if key == "" {
			// Also accept Bearer token for flexibility
			auth := c.GetHeader("Authorization")
			if strings.HasPrefix(auth, "Bearer ") {
				key = strings.TrimPrefix(auth, "Bearer ")
			}
		}

		if key == "" {
			response.Unauthorized(c, "API key ausente. Envie o header X-API-Key")
			c.Abort()
			return
		}

		user, err := userRepo.FindByAPIKey(key)
		if err != nil || user == nil {
			response.Unauthorized(c, "API key inválida ou expirada")
			c.Abort()
			return
		}

		c.Set("user_id", user.ID)
		c.Set("user_email", user.Email)
		c.Set("role", user.Role)
		// Store the raw key so the logout handler can identify which key to revoke
		c.Set("api_key", key)
		c.Next()
	}
}

// RequireAdmin returns a middleware that aborts with 403 unless the user has role='admin'.
func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.GetString("role") != "admin" {
			response.Forbidden(c, "Acesso restrito a administradores")
			c.Abort()
			return
		}
		c.Next()
	}
}
