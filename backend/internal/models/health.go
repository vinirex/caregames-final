package models

import "time"

// UserDevice represents a wearable or mobile device linked to the user's account.
type UserDevice struct {
	ID           string    `db:"id"             json:"id"`
	UserID       string    `db:"user_id"        json:"user_id"`
	Platform     string    `db:"platform"       json:"platform"`
	DeviceName   *string   `db:"device_name"    json:"device_name"`
	SyncEnabled  bool      `db:"sync_enabled"   json:"sync_enabled"`
	LastSyncedAt *time.Time`db:"last_synced_at" json:"last_synced_at"`
	CreatedAt    time.Time `db:"created_at"     json:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"     json:"updated_at"`
}

// HealthSyncRecord stores daily health telemetry data for a user.
type HealthSyncRecord struct {
	ID           string    `db:"id"             json:"id"`
	UserID       string    `db:"user_id"        json:"user_id"`
	DeviceID     *string   `db:"device_id"      json:"device_id"`
	RecordDate   string    `db:"record_date"    json:"record_date"` // Use string if only YYYY-MM-DD
	Steps        *int      `db:"steps"          json:"steps"`
	HeartRateBPM *int      `db:"heart_rate_bpm" json:"heart_rate_bpm"`
	RestingHrBPM *int      `db:"resting_hr_bpm" json:"resting_hr_bpm"`
	TemperatureC *float64  `db:"temperature_c"  json:"temperature_c"`
	Calories     *int      `db:"calories"       json:"calories"`
	DistanceM    *int      `db:"distance_m"     json:"distance_m"`
	SleepMin     *int      `db:"sleep_min"      json:"sleep_min"`
	SyncedAt     time.Time `db:"synced_at"      json:"synced_at"`
	Platform     *string   `db:"platform"       json:"platform"`
	RawPayload   *string   `db:"raw_payload"    json:"raw_payload"` // JSONB as string
}
