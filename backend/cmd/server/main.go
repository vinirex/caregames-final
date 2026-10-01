package main

import (
	"fmt"
	"log"

	"github.com/caregames/api/internal/config"
	"github.com/caregames/api/internal/database"
	"github.com/caregames/api/internal/router"
)

// @title           CareGames+ API
// @version         1.0
// @description     This is the backend API for CareGames+
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.swagger.io/support
// @contact.email  support@swagger.io

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8080
// @BasePath  /

// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name Authorization

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	db, err := database.Connect(cfg.DSN())
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	log.Printf("Running database migrations...")
	if err := database.RunMigrations(cfg.DSN(), "./internal/database/migrations"); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	r := router.Setup(db)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("🚀 CareGames+ API starting on %s (env=%s)", addr, cfg.Env)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
