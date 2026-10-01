package router

import (
	"github.com/caregames/api/internal/handlers"
	"github.com/caregames/api/internal/middleware"
	"github.com/caregames/api/internal/repositories"
	"github.com/caregames/api/internal/services"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

// Setup builds and returns the configured Gin engine.
func Setup(db *sqlx.DB) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())
	r.Use(cors.Default()) // allow all origins; restrict in production via config

	// ── Repositories ────────────────────────────────────────────
	userRepo   := repositories.NewUserRepository(db)
	pointsRepo := repositories.NewPointsRepository(db)

	// ── Services ────────────────────────────────────────────────
	authSvc    := services.NewAuthService(userRepo)
	profileSvc := services.NewProfileService(userRepo)
	pointsSvc  := services.NewPointsService(pointsRepo, userRepo)

	// ── Handlers ────────────────────────────────────────────────
	authH    := handlers.NewAuthHandler(authSvc)
	profileH := handlers.NewProfileHandler(profileSvc)
	pointsH  := handlers.NewPointsHandler(pointsSvc)

	// ── Auth middleware ──────────────────────────────────────────
	authMiddleware := middleware.Auth(userRepo)

	// ── Health check ────────────────────────────────────────────
	r.GET("/health", func(c *gin.Context) {
		if err := db.Ping(); err != nil {
			c.JSON(503, gin.H{"status": "degraded", "db": err.Error()})
			return
		}
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := r.Group("/api/v1")

	// ── Public routes (no auth) ──────────────────────────────────
	auth := api.Group("/auth")
	{
		auth.POST("/register", authH.Register)
		auth.POST("/login",    authH.Login)
	}

	// ── Protected routes ────────────────────────────────────────
	protected := api.Group("", authMiddleware)

	// Auth
	authProtected := protected.Group("/auth")
	{
		authProtected.GET("/me", authH.Me)
	}

	// Profile
	profile := protected.Group("/profile")
	{
		profile.GET("", profileH.GetProfile)
		profile.PUT("", profileH.UpdateProfile)
	}

	// Points
	points := protected.Group("/points")
	{
		points.GET("",         pointsH.GetBalance)
		points.GET("/history", pointsH.ListTransactions)
		points.POST("/spend",  pointsH.SpendPoints)
		// Admin only
		points.POST("/add", middleware.RequireAdmin(), pointsH.AddPoints)
	}

	return r
}
