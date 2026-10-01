.PHONY: help dev down test test-unit test-integration build lint migrate-up migrate-down clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Docker targets ───────────────────────────────────────────────────────────

dev: ## Start the API + PostgreSQL in Docker (development)
	docker compose up --build -d
	@echo "✅  API running on http://localhost:8080"

down: ## Stop and remove containers
	docker compose down

dev-logs: ## Tail API logs
	docker compose logs -f api

# ── Test targets ─────────────────────────────────────────────────────────────

test-db-up: ## Start isolated test PostgreSQL on port 5433
	docker compose -f docker-compose.test.yml up -d
	@echo "⏳  Waiting for test DB..."
	@sleep 5

test-db-down: ## Stop test PostgreSQL
	docker compose -f docker-compose.test.yml down

test-unit: ## Run unit tests only (no DB required)
	go test ./pkg/... -v -count=1 -coverprofile=coverage-unit.out
	go tool cover -func=coverage-unit.out

test-integration: test-db-up ## Run integration tests against test DB
	TEST_DB_HOST=localhost TEST_DB_PORT=5433 \
	TEST_DB_NAME=caregames_test TEST_DB_USER=caregames \
	TEST_DB_PASSWORD=caregames_secret \
	go test ./tests/... -v -count=1 -timeout 120s -coverprofile=coverage-integration.out
	go tool cover -func=coverage-integration.out
	$(MAKE) test-db-down

test: test-unit test-integration ## Run all tests

# ── Build targets ────────────────────────────────────────────────────────────

build: ## Build the binary locally
	go build -o bin/caregames-api ./cmd/server

lint: ## Run golangci-lint
	golangci-lint run ./...

# ── Database targets ─────────────────────────────────────────────────────────

migrate-up: ## Apply migrations (dev DB)
	docker compose exec postgres psql -U caregames -d caregames_db -f /dev/stdin < internal/database/migrations/000001_init_schema.up.sql

migrate-down: ## Rollback migrations (dev DB)
	docker compose exec postgres psql -U caregames -d caregames_db -f /dev/stdin < internal/database/migrations/000001_init_schema.down.sql

# ── Cleanup ───────────────────────────────────────────────────────────────────

clean: ## Remove build artifacts and coverage files
	rm -rf bin/ coverage-*.out

# ── Quick test of the running API ────────────────────────────────────────────

smoke: ## Quick smoke test against running dev server
	@echo "--- Health check ---"
	curl -s http://localhost:8080/health | python3 -m json.tool
	@echo "\n--- Register ---"
	curl -s -X POST http://localhost:8080/api/v1/auth/register \
		-H "Content-Type: application/json" \
		-d '{"email":"smoke@test.com","password":"Senha123","age":25}' | python3 -m json.tool
	@echo "\n--- Login ---"
	curl -s -X POST http://localhost:8080/api/v1/auth/login \
		-H "Content-Type: application/json" \
		-d '{"email":"smoke@test.com","password":"Senha123"}' | python3 -m json.tool
