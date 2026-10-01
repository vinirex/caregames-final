package models

import (
	"database/sql"
	"time"
)

// User represents a registered user.
type User struct {
	ID           string    `db:"id"            json:"id"`
	Email        string    `db:"email"         json:"email"`
	PasswordHash string    `db:"password_hash" json:"-"`
	Age          int       `db:"age"           json:"age"`
	Role         string    `db:"role"          json:"role"`
	IsActive     bool      `db:"is_active"     json:"is_active"`
	CreatedAt    time.Time `db:"created_at"    json:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"    json:"updated_at"`
}

// UserAPIKey represents an API key belonging to a user.
type UserAPIKey struct {
	ID         string         `db:"id"           json:"id"`
	UserID     string         `db:"user_id"      json:"user_id"`
	APIKey     string         `db:"api_key"      json:"-"` // never expose in lists
	Label      sql.NullString `db:"label"        json:"label,omitempty"`
	LastUsedAt sql.NullTime   `db:"last_used_at" json:"last_used_at,omitempty"`
	ExpiresAt  sql.NullTime   `db:"expires_at"   json:"expires_at,omitempty"`
	IsActive   bool           `db:"is_active"    json:"is_active"`
	CreatedAt  time.Time      `db:"created_at"   json:"created_at"`
}

// UserProfile holds personal information for a user.
type UserProfile struct {
	ID        string         `db:"id"         json:"id"`
	UserID    string         `db:"user_id"    json:"user_id"`
	Name      sql.NullString `db:"name"       json:"name,omitempty"`
	Birthday  sql.NullTime   `db:"birthday"   json:"birthday,omitempty"`
	Address   sql.NullString `db:"address"    json:"address,omitempty"`
	PhotoURL  sql.NullString `db:"photo_url"  json:"photo_url,omitempty"`
	ThemePref string         `db:"theme_pref" json:"theme_pref"`
	CreatedAt time.Time      `db:"created_at" json:"created_at"`
	UpdatedAt time.Time      `db:"updated_at" json:"updated_at"`
}

// UserPoints holds the current points balance for a user.
type UserPoints struct {
	ID          string    `db:"id"           json:"id"`
	UserID      string    `db:"user_id"      json:"user_id"`
	Balance     int       `db:"balance"      json:"balance"`
	TotalEarned int       `db:"total_earned" json:"total_earned"`
	TotalSpent  int       `db:"total_spent"  json:"total_spent"`
	UpdatedAt   time.Time `db:"updated_at"   json:"updated_at"`
}

// PointTransaction records a single debit or credit of points.
type PointTransaction struct {
	ID            string         `db:"id"             json:"id"`
	UserID        string         `db:"user_id"        json:"user_id"`
	Amount        int            `db:"amount"         json:"amount"`
	Type          string         `db:"type"           json:"type"`
	Reason        string         `db:"reason"         json:"reason"`
	ReferenceID   sql.NullString `db:"reference_id"   json:"reference_id,omitempty"`
	ReferenceType sql.NullString `db:"reference_type" json:"reference_type,omitempty"`
	BalanceAfter  int            `db:"balance_after"  json:"balance_after"`
	CreatedAt     time.Time      `db:"created_at"     json:"created_at"`
}
