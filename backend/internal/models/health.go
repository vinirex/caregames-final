package models

import (
	"database/sql"
	"time"
)

// HealthSyncRecord holds daily consolidated health telemetry for a user.
type HealthSyncRecord struct {
	ID           string         `db:"id"             json:"id"`
	UserID       string         `db:"user_id"        json:"user_id"`
	DeviceID     sql.NullString `db:"device_id"      json:"device_id,omitempty"`
	RecordDate   time.Time      `db:"record_date"    json:"record_date"`
	Steps        sql.NullInt64  `db:"steps"          json:"steps,omitempty"`
	HeartRateBPM sql.NullInt64  `db:"heart_rate_bpm" json:"heart_rate_bpm,omitempty"`
	RestingHRBPM sql.NullInt64  `db:"resting_hr_bpm" json:"resting_hr_bpm,omitempty"`
	TemperatureC sql.NullString `db:"temperature_c"  json:"temperature_c,omitempty"`
	Calories     sql.NullInt64  `db:"calories"       json:"calories,omitempty"`
	DistanceM    sql.NullInt64  `db:"distance_m"     json:"distance_m,omitempty"`
	SleepMin     sql.NullInt64  `db:"sleep_min"      json:"sleep_min,omitempty"`
	SyncedAt     time.Time      `db:"synced_at"      json:"synced_at"`
	Platform     sql.NullString `db:"platform"       json:"platform,omitempty"`
}

// UserDevice represents a health platform or wearable linked to a user.
type UserDevice struct {
	ID           string         `db:"id"             json:"id"`
	UserID       string         `db:"user_id"        json:"user_id"`
	Platform     string         `db:"platform"       json:"platform"`
	DeviceName   sql.NullString `db:"device_name"    json:"device_name,omitempty"`
	SyncEnabled  bool           `db:"sync_enabled"   json:"sync_enabled"`
	LastSyncedAt sql.NullTime   `db:"last_synced_at" json:"last_synced_at,omitempty"`
	CreatedAt    time.Time      `db:"created_at"     json:"created_at"`
	UpdatedAt    time.Time      `db:"updated_at"     json:"updated_at"`
}

// Notification is a persistent in-app notification for a user.
type Notification struct {
	ID        string    `db:"id"         json:"id"`
	UserID    string    `db:"user_id"    json:"user_id"`
	Title     string    `db:"title"      json:"title"`
	Message   string    `db:"message"    json:"message"`
	IconName  string    `db:"icon_name"  json:"icon_name"`
	IconColor string    `db:"icon_color" json:"icon_color"`
	IsRead    bool      `db:"is_read"    json:"is_read"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

// Season represents a competitive ranking season.
type Season struct {
	ID          string         `db:"id"          json:"id"`
	Name        string         `db:"name"        json:"name"`
	Description sql.NullString `db:"description" json:"description,omitempty"`
	StartsAt    time.Time      `db:"starts_at"   json:"starts_at"`
	EndsAt      time.Time      `db:"ends_at"     json:"ends_at"`
	IsActive    bool           `db:"is_active"   json:"is_active"`
	CreatedBy   sql.NullString `db:"created_by"  json:"created_by,omitempty"`
	CreatedAt   time.Time      `db:"created_at"  json:"created_at"`
}

// Group represents a team of users competing together.
type Group struct {
	ID          string         `db:"id"          json:"id"`
	Name        string         `db:"name"        json:"name"`
	Description sql.NullString `db:"description" json:"description,omitempty"`
	AvatarURL   sql.NullString `db:"avatar_url"  json:"avatar_url,omitempty"`
	InviteCode  string         `db:"invite_code" json:"invite_code"`
	OwnerID     string         `db:"owner_id"    json:"owner_id"`
	IsPublic    bool           `db:"is_public"   json:"is_public"`
	MaxMembers  int            `db:"max_members" json:"max_members"`
	CreatedAt   time.Time      `db:"created_at"  json:"created_at"`
	UpdatedAt   time.Time      `db:"updated_at"  json:"updated_at"`
}

// GroupMember represents a user's membership in a group.
type GroupMember struct {
	ID       string    `db:"id"       json:"id"`
	GroupID  string    `db:"group_id" json:"group_id"`
	UserID   string    `db:"user_id"  json:"user_id"`
	Role     string    `db:"role"     json:"role"`
	JoinedAt time.Time `db:"joined_at" json:"joined_at"`
}

// SeasonRanking holds a snapshot of a user's ranking in a season.
type SeasonRanking struct {
	ID             string    `db:"id"              json:"id"`
	SeasonID       string    `db:"season_id"       json:"season_id"`
	UserID         string    `db:"user_id"         json:"user_id"`
	PointsSnapshot int       `db:"points_snapshot" json:"points_snapshot"`
	RankPosition   int       `db:"rank_position"   json:"rank_position"`
	OptIn          bool      `db:"opt_in"          json:"opt_in"`
	UpdatedAt      time.Time `db:"updated_at"      json:"updated_at"`
}
