package repositories

import (
	"database/sql"
	"fmt"

	"github.com/caregames/api/internal/models"
	"github.com/jmoiron/sqlx"
)

// ChallengeRepository handles database operations for challenges.
type ChallengeRepository struct {
	db *sqlx.DB
}

// NewChallengeRepository creates a new ChallengeRepository.
func NewChallengeRepository(db *sqlx.DB) *ChallengeRepository {
	return &ChallengeRepository{db: db}
}

// ListActive returns all currently active challenges for the current season.
func (r *ChallengeRepository) ListActive() ([]models.Challenge, error) {
	var challenges []models.Challenge
	query := `
		SELECT
			id, slug, title, description, icon_name, type, metric,
			target_value, target_unit, points_reward, is_active, is_fixed,
			season_id, created_by, created_at, updated_at
		FROM challenges
		WHERE is_active = true
		  AND (
			type != 'seasonal' 
			OR season_id IS NULL 
			OR season_id IN (SELECT id FROM seasons WHERE is_active = true)
		  )
		ORDER BY type ASC, points_reward ASC
	`
	if err := r.db.Select(&challenges, query); err != nil {
		return nil, fmt.Errorf("challenge_repo.ListActive: %w", err)
	}
	return challenges, nil
}

// GetByID retrieves a single challenge by ID or slug.
func (r *ChallengeRepository) GetByID(id string) (*models.Challenge, error) {
	var c models.Challenge
	query := `
		SELECT
			id, slug, title, description, icon_name, type, metric,
			target_value, target_unit, points_reward, is_active, is_fixed,
			season_id, created_by, created_at, updated_at
		FROM challenges
		WHERE id::text = $1 OR slug = $1
	`
	if err := r.db.Get(&c, query, id); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("challenge_repo.GetByID: %w", err)
	}
	return &c, nil
}

// GetUserProgress returns a user's progress for a specific challenge.
func (r *ChallengeRepository) GetUserProgress(userID, challengeID string) (*models.UserChallengeProgress, error) {
	var p models.UserChallengeProgress
	query := `
		SELECT
			id, user_id, challenge_id, status, current_value,
			completed_at, points_awarded, created_at, updated_at
		FROM user_challenge_progress
		WHERE user_id = $1 AND (challenge_id::text = $2 OR challenge_id IN (SELECT id FROM challenges WHERE slug = $2))
	`
	if err := r.db.Get(&p, query, userID, challengeID); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("challenge_repo.GetUserProgress: %w", err)
	}
	return &p, nil
}

// CreateProgress initializes a progress tracking row for a user/challenge.
func (r *ChallengeRepository) CreateProgress(userID, challengeID string) error {
	query := `
		INSERT INTO user_challenge_progress (user_id, challenge_id, status)
		VALUES ($1, COALESCE((SELECT id FROM challenges WHERE id::text = $2 OR slug = $2), $2::uuid), 'in_progress')
		ON CONFLICT (user_id, challenge_id) DO NOTHING
	`
	if _, err := r.db.Exec(query, userID, challengeID); err != nil {
		return fmt.Errorf("challenge_repo.CreateProgress: %w", err)
	}
	return nil
}

// UpdateProgress updates the current_value of a challenge.
func (r *ChallengeRepository) UpdateProgress(userID, challengeID string, value float64) error {
	query := `
		UPDATE user_challenge_progress
		SET current_value = $1, updated_at = NOW()
		WHERE user_id = $2 AND (challenge_id::text = $3 OR challenge_id IN (SELECT id FROM challenges WHERE slug = $3)) AND status = 'in_progress'
	`
	res, err := r.db.Exec(query, value, userID, challengeID)
	if err != nil {
		return fmt.Errorf("challenge_repo.UpdateProgress: %w", err)
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("not_found: progress record not found or not in_progress")
	}
	return nil
}

// UpdateStatus completes a challenge.
func (r *ChallengeRepository) UpdateStatus(userID, challengeID string, points int) error {
	query := `
		UPDATE user_challenge_progress
		SET status = 'completed', completed_at = NOW(), points_awarded = $1, updated_at = NOW()
		WHERE user_id = $2 AND (challenge_id::text = $3 OR challenge_id IN (SELECT id FROM challenges WHERE slug = $3)) AND status = 'in_progress'
	`
	res, err := r.db.Exec(query, points, userID, challengeID)
	if err != nil {
		return fmt.Errorf("challenge_repo.UpdateStatus: %w", err)
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("not_found: progress record not found or already completed")
	}
	return nil
}

// Create inserts a new challenge into the database.
func (r *ChallengeRepository) Create(c *models.Challenge) error {
	query := `
		INSERT INTO challenges (
			slug, title, description, icon_name, type, metric,
			target_value, target_unit, points_reward, is_active, is_fixed,
			season_id, created_by
		)
		VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8, $9, $10, $11,
			NULLIF($12, '')::uuid, NULLIF($13, '')::uuid
		)
		RETURNING id, created_at, updated_at
	`
	var seasonIDStr, createdByStr string
	if c.SeasonID.Valid {
		seasonIDStr = c.SeasonID.String
	}
	if c.CreatedBy.Valid {
		createdByStr = c.CreatedBy.String
	}

	return r.db.QueryRow(
		query,
		c.Slug, c.Title, c.Description, c.IconName, c.Type, c.Metric,
		c.TargetValue, c.TargetUnit, c.PointsReward, c.IsActive, c.IsFixed,
		seasonIDStr, createdByStr,
	).Scan(&c.ID, &c.CreatedAt, &c.UpdatedAt)
}

// ListBySeasonID returns all challenges linked to a season.
func (r *ChallengeRepository) ListBySeasonID(seasonID string) ([]models.Challenge, error) {
	var challenges []models.Challenge
	query := `
		SELECT
			id, slug, title, description, icon_name, type, metric,
			target_value, target_unit, points_reward, is_active, is_fixed,
			season_id, created_by, created_at, updated_at
		FROM challenges
		WHERE season_id::text = $1
		ORDER BY points_reward ASC
	`
	if err := r.db.Select(&challenges, query, seasonID); err != nil {
		return nil, fmt.Errorf("challenge_repo.ListBySeasonID: %w", err)
	}
	return challenges, nil
}

// ActivateSeasonalChallenges activates all challenges associated with a season.
func (r *ChallengeRepository) ActivateSeasonalChallenges(seasonID string) error {
	query := `UPDATE challenges SET is_active = true WHERE season_id::text = $1`
	_, err := r.db.Exec(query, seasonID)
	if err != nil {
		return fmt.Errorf("challenge_repo.ActivateSeasonalChallenges: %w", err)
	}
	return nil
}

// DeactivateOtherSeasonalChallenges deactivates seasonal challenges from other seasons.
func (r *ChallengeRepository) DeactivateOtherSeasonalChallenges(activeSeasonID string) error {
	query := `UPDATE challenges SET is_active = false WHERE type = 'seasonal' AND (season_id IS NULL OR season_id::text != $1)`
	_, err := r.db.Exec(query, activeSeasonID)
	if err != nil {
		return fmt.Errorf("challenge_repo.DeactivateOtherSeasonalChallenges: %w", err)
	}
	return nil
}

// ChallengeSummary represents brief metadata of an existing challenge.
type ChallengeSummary struct {
	Slug   string `db:"slug"   json:"slug"`
	Title  string `db:"title"  json:"title"`
	Metric string `db:"metric" json:"metric"`
}

// ListSummaries retrieves recent challenges to avoid duplicate generation.
func (r *ChallengeRepository) ListSummaries(limit int) ([]ChallengeSummary, error) {
	if limit <= 0 {
		limit = 10
	}
	var summaries []ChallengeSummary
	query := `SELECT slug, title, metric FROM challenges ORDER BY created_at DESC LIMIT $1`
	if err := r.db.Select(&summaries, query, limit); err != nil {
		return nil, fmt.Errorf("challenge_repo.ListSummaries: %w", err)
	}
	return summaries, nil
}


