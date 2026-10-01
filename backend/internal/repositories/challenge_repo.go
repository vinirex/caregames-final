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

// ListActive returns all currently active challenges.
func (r *ChallengeRepository) ListActive() ([]models.Challenge, error) {
	var challenges []models.Challenge
	query := `
		SELECT
			id, slug, title, description, icon_name, type, metric,
			target_value, target_unit, points_reward, is_active, is_fixed,
			season_id, created_by, created_at, updated_at
		FROM challenges
		WHERE is_active = true
		ORDER BY type ASC, points_reward ASC
	`
	if err := r.db.Select(&challenges, query); err != nil {
		return nil, fmt.Errorf("challenge_repo.ListActive: %w", err)
	}
	return challenges, nil
}

// GetByID retrieves a single challenge by ID.
func (r *ChallengeRepository) GetByID(id string) (*models.Challenge, error) {
	var c models.Challenge
	query := `
		SELECT
			id, slug, title, description, icon_name, type, metric,
			target_value, target_unit, points_reward, is_active, is_fixed,
			season_id, created_by, created_at, updated_at
		FROM challenges
		WHERE id = $1
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
		WHERE user_id = $1 AND challenge_id = $2
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
		VALUES ($1, $2, 'in_progress')
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
		WHERE user_id = $2 AND challenge_id = $3 AND status = 'in_progress'
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
		WHERE user_id = $2 AND challenge_id = $3 AND status = 'in_progress'
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
