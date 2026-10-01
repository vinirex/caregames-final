package repositories

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/caregames/api/internal/models"
	"github.com/jmoiron/sqlx"
)

// HealthRepository handles database operations for health syncs and devices.
type HealthRepository struct {
	db *sqlx.DB
}

// NewHealthRepository creates a new HealthRepository.
func NewHealthRepository(db *sqlx.DB) *HealthRepository {
	return &HealthRepository{db: db}
}

// SyncRecord inserts or updates a health sync record for a specific date.
func (r *HealthRepository) SyncRecord(record *models.HealthSyncRecord) error {
	query := `
		INSERT INTO health_sync_records (
			user_id, record_date, steps, heart_rate_bpm, resting_hr_bpm,
			temperature_c, calories, distance_m, sleep_min, platform, synced_at
		) VALUES (
			:user_id, :record_date, :steps, :heart_rate_bpm, :resting_hr_bpm,
			:temperature_c, :calories, :distance_m, :sleep_min, :platform, NOW()
		)
		ON CONFLICT (user_id, record_date)
		DO UPDATE SET
			steps = EXCLUDED.steps,
			heart_rate_bpm = EXCLUDED.heart_rate_bpm,
			resting_hr_bpm = EXCLUDED.resting_hr_bpm,
			temperature_c = EXCLUDED.temperature_c,
			calories = EXCLUDED.calories,
			distance_m = EXCLUDED.distance_m,
			sleep_min = EXCLUDED.sleep_min,
			platform = EXCLUDED.platform,
			synced_at = NOW()
	`
	_, err := r.db.NamedExec(query, record)
	if err != nil {
		return fmt.Errorf("health_repo.SyncRecord: %w", err)
	}
	return nil
}

// ListRecords returns historical sync records for a user.
func (r *HealthRepository) ListRecords(userID string) ([]models.HealthSyncRecord, error) {
	var records []models.HealthSyncRecord
	query := `
		SELECT
			id, user_id, device_id, record_date, steps, heart_rate_bpm, resting_hr_bpm,
			temperature_c, calories, distance_m, sleep_min, synced_at, platform
		FROM health_sync_records
		WHERE user_id = $1
		ORDER BY record_date DESC
	`
	if err := r.db.Select(&records, query, userID); err != nil {
		return nil, fmt.Errorf("health_repo.ListRecords: %w", err)
	}
	return records, nil
}

// GetRecordByDate returns a single day's record.
func (r *HealthRepository) GetRecordByDate(userID string, date time.Time) (*models.HealthSyncRecord, error) {
	var rec models.HealthSyncRecord
	query := `
		SELECT
			id, user_id, device_id, record_date, steps, heart_rate_bpm, resting_hr_bpm,
			temperature_c, calories, distance_m, sleep_min, synced_at, platform
		FROM health_sync_records
		WHERE user_id = $1 AND record_date = $2
	`
	if err := r.db.Get(&rec, query, userID, date.Format("2006-01-02")); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("health_repo.GetRecordByDate: %w", err)
	}
	return &rec, nil
}
