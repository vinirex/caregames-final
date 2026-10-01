# ── Stage 1: Build ─────────────────────────────────────────
FROM golang:1.26-alpine AS builder

WORKDIR /app

# Download dependencies first (cached layer)
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /caregames-api ./cmd/server

# ── Stage 2: Run ────────────────────────────────────────────
FROM alpine:3.21

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy binary and migration files
COPY --from=builder /caregames-api .
COPY --from=builder /app/internal/database/migrations ./internal/database/migrations

EXPOSE 8080

ENTRYPOINT ["/app/caregames-api"]
