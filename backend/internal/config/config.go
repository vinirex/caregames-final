package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	// Server
	Port string
	Env  string

	// Database
	DBHost     string
	DBPort     string
	DBName     string
	DBUser     string
	DBPassword string
	DBSSLMode  string

	// Security
	APIKeyPrefix string
	BcryptCost   int

	// CORS
	AllowedOrigins string
	// Seed
	RunSeed bool
}

// Load reads configuration from a .env file (if present) and environment variables.
func Load() (*Config, error) {
	// Load .env file if it exists (silently ignore if absent in production)
	_ = godotenv.Load()

	cfg := &Config{
		Port:           getEnv("PORT", "8080"),
		Env:            getEnv("ENV", "development"),
		DBHost:         getEnv("DB_HOST", "localhost"),
		DBPort:         getEnv("DB_PORT", "5432"),
		DBName:         getEnv("DB_NAME", "caregames_db"),
		DBUser:         getEnv("DB_USER", "caregames"),
		DBPassword:     getEnv("DB_PASSWORD", "caregames"),
		DBSSLMode:      getEnv("DB_SSL_MODE", "disable"),
		APIKeyPrefix:   getEnv("API_KEY_PREFIX", "cgk_"),
		AllowedOrigins: getEnv("ALLOWED_ORIGINS", "*"),
	}

	cost, err := strconv.Atoi(getEnv("BCRYPT_COST", "12"))
	if err != nil {
		return nil, fmt.Errorf("config: invalid BCRYPT_COST: %w", err)
	}
	cfg.BcryptCost = cost

	runSeed, _ := strconv.ParseBool(getEnv("RUN_SEED", "false"))
	cfg.RunSeed = runSeed

	return cfg, nil
}

// DSN returns the PostgreSQL connection string.
func (c *Config) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s dbname=%s user=%s password=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBName, c.DBUser, c.DBPassword, c.DBSSLMode,
	)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
