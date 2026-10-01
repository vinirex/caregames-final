package router

import (
	"github.com/caregames/api/internal/handlers"
	"github.com/caregames/api/internal/middleware"
	"github.com/caregames/api/internal/repositories"
	"github.com/caregames/api/internal/services"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	_ "github.com/caregames/api/docs"
)

// Setup builds and returns the configured Gin engine.
func Setup(db *sqlx.DB) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())
	r.Use(cors.Default()) // allow all origins; restrict in production via config

	// ── Repositories ────────────────────────────────────────────
	userRepo      := repositories.NewUserRepository(db)
	pointsRepo    := repositories.NewPointsRepository(db)
	challengeRepo := repositories.NewChallengeRepository(db)
	benefitRepo   := repositories.NewBenefitRepository(db)
	healthRepo    := repositories.NewHealthRepository(db)
	notifRepo     := repositories.NewNotificationRepository(db)
	groupRepo     := repositories.NewGroupRepository(db)
	rankingRepo   := repositories.NewRankingRepository(db)
	seasonRepo    := repositories.NewSeasonRepository(db)

	// ── Services ────────────────────────────────────────────────
	authSvc      := services.NewAuthService(userRepo)
	profileSvc   := services.NewProfileService(userRepo)
	pointsSvc    := services.NewPointsService(pointsRepo, userRepo)
	challengeSvc := services.NewChallengeService(challengeRepo)
	benefitSvc   := services.NewBenefitService(benefitRepo, pointsSvc)
	healthSvc    := services.NewHealthService(healthRepo, challengeSvc)
	notifSvc     := services.NewNotificationService(notifRepo)
	groupSvc     := services.NewGroupService(groupRepo)
	rankingSvc   := services.NewRankingService(rankingRepo)
	seasonSvc    := services.NewSeasonService(seasonRepo)

	// ── Handlers ────────────────────────────────────────────────
	authH      := handlers.NewAuthHandler(authSvc)
	profileH   := handlers.NewProfileHandler(profileSvc)
	pointsH    := handlers.NewPointsHandler(pointsSvc)
	challengeH := handlers.NewChallengeHandler(challengeSvc, pointsSvc, notifSvc)
	benefitH   := handlers.NewBenefitHandler(benefitSvc)
	healthH    := handlers.NewHealthHandler(healthSvc)
	notifH     := handlers.NewNotificationHandler(notifSvc)
	groupH     := handlers.NewGroupHandler(groupSvc)
	rankingH   := handlers.NewRankingHandler(rankingSvc)
	seasonH    := handlers.NewSeasonHandler(seasonSvc)

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

	// ── Swagger docs ────────────────────────────────────────────
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

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

	// Challenges
	challenges := protected.Group("/challenges")
	{
		challenges.GET("", challengeH.ListActive)
		challenges.POST("/:id/accept", challengeH.AcceptChallenge)
		challenges.PUT("/:id/progress", challengeH.UpdateProgress)
		challenges.POST("/:id/complete", challengeH.CompleteChallenge)
	}

	// Benefits
	benefits := protected.Group("/benefits")
	{
		benefits.GET("", benefitH.ListActive)
		benefits.GET("/:id", benefitH.GetByID)
		benefits.POST("/:id/redeem", benefitH.RedeemBenefit)
		benefits.GET("/redemptions", benefitH.ListRedemptions)
	}

	// Health
	health := protected.Group("/health")
	{
		health.POST("/sync", healthH.SyncData)
		health.GET("/records", healthH.ListRecords)
		health.GET("/records/:date", healthH.GetRecordByDate)
	}

	// Notifications
	notifs := protected.Group("/notifications")
	{
		notifs.GET("", notifH.List)
		notifs.GET("/unread-count", notifH.GetUnreadCount)
		notifs.PUT("/:id/read", notifH.MarkAsRead)
		notifs.PUT("/read-all", notifH.MarkAllAsRead)
		notifs.DELETE("/:id", notifH.Delete)
		notifs.DELETE("/read", notifH.DeleteRead)
	}

	// Groups
	groups := protected.Group("/groups")
	{
		groups.GET("", groupH.ListUserGroups)
		groups.POST("", groupH.CreateGroup)
		groups.POST("/join", groupH.JoinGroup)
		groups.GET("/:id/ranking", groupH.GetRanking)
		groups.POST("/:id/leave", groupH.LeaveGroup)
	}

	// Rankings
	rankings := protected.Group("/rankings")
	{
		rankings.GET("/global", rankingH.GetGlobalRanking)
		rankings.POST("/global/opt-in", rankingH.OptIn)
		rankings.POST("/global/opt-out", rankingH.OptOut)
	}

	// Seasons (admin protected in a real app, just protected for now)
	seasons := protected.Group("/seasons")
	{
		seasons.GET("", seasonH.ListSeasons)
		seasons.GET("/active", seasonH.GetActiveSeason)
		seasons.GET("/:id", seasonH.GetSeason)
		seasons.POST("", seasonH.CreateSeason)
		seasons.PUT("/:id", seasonH.UpdateSeason)
		seasons.DELETE("/:id", seasonH.DeleteSeason)
		seasons.POST("/:id/activate", seasonH.ActivateSeason)
	}

	return r
}
