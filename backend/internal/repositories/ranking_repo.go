package repositories

import (
	"database/sql"
	"fmt"

	"github.com/caregames/api/internal/models"
	"github.com/jmoiron/sqlx"
)

// RankingRepository handles ranking and season operations.
type RankingRepository struct {
	db *sqlx.DB
}

// NewRankingRepository creates a new ranking repository.
func NewRankingRepository(db *sqlx.DB) *RankingRepository {
	return &RankingRepository{db: db}
}

// GetActiveSeason returns the currently active season, if any.
func (r *RankingRepository) GetActiveSeason() (*models.Season, error) {
	var season models.Season
	query := `SELECT * FROM seasons WHERE is_active = true ORDER BY created_at DESC LIMIT 1`
	err := r.db.Get(&season, query)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No active season
		}
		return nil, fmt.Errorf("ranking_repo.GetActiveSeason: %w", err)
	}
	return &season, nil
}

// GetGlobalLeaderboard returns the global ranking entries.
func (r *RankingRepository) GetGlobalLeaderboard(limit, offset int) ([]models.GlobalRankingEntry, error) {
	var leaderboard []models.GlobalRankingEntry
	query := `
		SELECT 
			ROW_NUMBER() OVER(ORDER BY COALESCE(up.balance, 0) DESC) as rank,
			u.id as user_id,
			p.name as name,
			p.photo_url as avatar_url,
			SUBSTRING(p.name FROM 1 FOR 2) as initials,
			COALESCE(up.balance, 0) as points
		FROM users u
		LEFT JOIN user_profiles p ON u.id = p.user_id
		LEFT JOIN user_points up ON u.id = up.user_id
		WHERE u.role = 'user' AND u.is_active = true
		ORDER BY points DESC
		LIMIT $1 OFFSET $2
	`
	if err := r.db.Select(&leaderboard, query, limit, offset); err != nil {
		return nil, fmt.Errorf("ranking_repo.GetGlobalLeaderboard: %w", err)
	}
	return leaderboard, nil
}

// GetUserRank returns a specific user's global rank position.
func (r *RankingRepository) GetUserRank(userID string) (*models.CurrentUserRank, error) {
	var rank models.CurrentUserRank
	query := `
		WITH RankedUsers AS (
			SELECT 
				u.id as user_id,
				COALESCE(up.balance, 0) as points,
				ROW_NUMBER() OVER(ORDER BY COALESCE(up.balance, 0) DESC) as rank
			FROM users u
			LEFT JOIN user_points up ON u.id = up.user_id
			WHERE u.role = 'user' AND u.is_active = true
		)
		SELECT rank, points FROM RankedUsers WHERE user_id = $1
	`
	if err := r.db.Get(&rank, query, userID); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("ranking_repo.GetUserRank: %w", err)
	}

	// Assuming they are opted-in by default if we don't have explicit season tracking
	rank.OptIn = true 
	return &rank, nil
}

// EnsureSeasonRanking ensures a user has a tracking row for the current season.
func (r *RankingRepository) EnsureSeasonRanking(seasonID, userID string) error {
	query := `
		INSERT INTO season_rankings (season_id, user_id, opt_in)
		VALUES ($1, $2, true)
		ON CONFLICT (season_id, user_id) DO NOTHING
	`
	_, err := r.db.Exec(query, seasonID, userID)
	if err != nil {
		return fmt.Errorf("ranking_repo.EnsureSeasonRanking: %w", err)
	}
	return nil
}

// SetOptIn changes a user's opt_in status for the season.
func (r *RankingRepository) SetOptIn(seasonID, userID string, optIn bool) error {
	query := `
		INSERT INTO season_rankings (season_id, user_id, opt_in)
		VALUES ($1, $2, $3)
		ON CONFLICT (season_id, user_id) DO UPDATE SET opt_in = $3
	`
	_, err := r.db.Exec(query, seasonID, userID, optIn)
	if err != nil {
		return fmt.Errorf("ranking_repo.SetOptIn: %w", err)
	}
	return nil
}

// GetUserOptIn checks if a user is opted in for a given season.
func (r *RankingRepository) GetUserOptIn(seasonID, userID string) (bool, error) {
	var optIn bool
	query := `SELECT opt_in FROM season_rankings WHERE season_id = $1 AND user_id = $2`
	err := r.db.Get(&optIn, query, seasonID, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return true, nil // default true if not found in season_rankings
		}
		return false, fmt.Errorf("ranking_repo.GetUserOptIn: %w", err)
	}
	return optIn, nil
}
