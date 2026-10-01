package models

import (
	"database/sql"
	"time"
)

// Challenge represents a health/fitness challenge.
type Challenge struct {
	ID           string         `db:"id"            json:"id"`
	Slug         string         `db:"slug"          json:"slug"`
	Title        string         `db:"title"         json:"title"`
	Description  string         `db:"description"   json:"description"`
	IconName     sql.NullString `db:"icon_name"     json:"icon_name,omitempty"`
	Type         string         `db:"type"          json:"type"`
	Metric       string         `db:"metric"        json:"metric"`
	TargetValue  float64        `db:"target_value"  json:"target_value"`
	TargetUnit   string         `db:"target_unit"   json:"target_unit"`
	PointsReward int            `db:"points_reward" json:"points_reward"`
	IsActive     bool           `db:"is_active"     json:"is_active"`
	IsFixed      bool           `db:"is_fixed"      json:"is_fixed"`
	SeasonID     sql.NullString `db:"season_id"     json:"season_id,omitempty"`
	CreatedBy    sql.NullString `db:"created_by"    json:"created_by,omitempty"`
	CreatedAt    time.Time      `db:"created_at"    json:"created_at"`
	UpdatedAt    time.Time      `db:"updated_at"    json:"updated_at"`
}

// UserChallengeProgress tracks a user's progress on a specific challenge.
type UserChallengeProgress struct {
	ID            string         `db:"id"             json:"id"`
	UserID        string         `db:"user_id"        json:"user_id"`
	ChallengeID   string         `db:"challenge_id"   json:"challenge_id"`
	Status        string         `db:"status"         json:"status"`
	CurrentValue  float64        `db:"current_value"  json:"current_value"`
	CompletedAt   sql.NullTime   `db:"completed_at"   json:"completed_at,omitempty"`
	PointsAwarded int            `db:"points_awarded" json:"points_awarded"`
	CreatedAt     time.Time      `db:"created_at"     json:"created_at"`
	UpdatedAt     time.Time      `db:"updated_at"     json:"updated_at"`
}

// Benefit represents a redeemable reward in the benefits catalog.
type Benefit struct {
	ID          string         `db:"id"           json:"id"`
	Title       string         `db:"title"        json:"title"`
	Description string         `db:"description"  json:"description"`
	ImageURL    sql.NullString `db:"image_url"    json:"image_url,omitempty"`
	PointsCost  int            `db:"points_cost"  json:"points_cost"`
	Stock       sql.NullInt64  `db:"stock"        json:"stock,omitempty"`
	IsActive    bool           `db:"is_active"    json:"is_active"`
	Category    sql.NullString `db:"category"     json:"category,omitempty"`
	PartnerName sql.NullString `db:"partner_name" json:"partner_name,omitempty"`
	ValidUntil  sql.NullTime   `db:"valid_until"  json:"valid_until,omitempty"`
	CreatedBy   sql.NullString `db:"created_by"   json:"created_by,omitempty"`
	CreatedAt   time.Time      `db:"created_at"   json:"created_at"`
	UpdatedAt   time.Time      `db:"updated_at"   json:"updated_at"`
}

// BenefitRedemption records a user redeeming a benefit.
type BenefitRedemption struct {
	ID          string         `db:"id"           json:"id"`
	UserID      string         `db:"user_id"      json:"user_id"`
	BenefitID   string         `db:"benefit_id"   json:"benefit_id"`
	PointsSpent int            `db:"points_spent" json:"points_spent"`
	Status      string         `db:"status"       json:"status"`
	VoucherCode sql.NullString `db:"voucher_code" json:"voucher_code,omitempty"`
	RedeemedAt  time.Time      `db:"redeemed_at"  json:"redeemed_at"`
	ConfirmedAt sql.NullTime   `db:"confirmed_at" json:"confirmed_at,omitempty"`
	Notes       sql.NullString `db:"notes"        json:"notes,omitempty"`
}
