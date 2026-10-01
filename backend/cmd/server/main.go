package main

import (
	"fmt"
	"log"

	"github.com/caregames/api/internal/config"
	"github.com/caregames/api/internal/database"
	"github.com/caregames/api/internal/router"
)

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
