package services

import (
	"fmt"

	"github.com/caregames/api/internal/models"
	"github.com/caregames/api/internal/repositories"
)

// RankingService handles rankings and season logic.
type RankingService struct {
	repo *repositories.RankingRepository
}

// NewRankingService creates a new RankingService.
func NewRankingService(repo *repositories.RankingRepository) *RankingService {
	return &RankingService{repo: repo}
}

// GetGlobalRanking retrieves the global ranking leaderboard for the active season.
func (s *RankingService) GetGlobalRanking(userID string, limit, offset int) (*models.GlobalRankingResponse, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	season, err := s.repo.GetActiveSeason()
	if err != nil {
		return nil, fmt.Errorf("ranking_service.GetGlobalRanking: active season: %w", err)
	}

	leaderboard, err := s.repo.GetGlobalLeaderboard(limit, offset)
	if err != nil {
		return nil, fmt.Errorf("ranking_service.GetGlobalRanking: leaderboard: %w", err)
	}

	var currentUserRank *models.CurrentUserRank
	if userID != "" {
		for i, entry := range leaderboard {
			if entry.UserID == userID {
				leaderboard[i].IsCurrentUser = true
			}
		}

		rank, err := s.repo.GetUserRank(userID)
		if err != nil {
			return nil, fmt.Errorf("ranking_service.GetGlobalRanking: user rank: %w", err)
		}
		
		if rank != nil && season != nil {
			optIn, err := s.repo.GetUserOptIn(season.ID, userID)
			if err == nil {
				rank.OptIn = optIn
			}
		}
		currentUserRank = rank
	}

	return &models.GlobalRankingResponse{
		Season:      season,
		Leaderboard: leaderboard,
		CurrentUser: currentUserRank,
	}, nil
}

// SetOptIn toggles the user's participation in the global ranking.
func (s *RankingService) SetOptIn(userID string, optIn bool) error {
	season, err := s.repo.GetActiveSeason()
	if err != nil {
		return fmt.Errorf("ranking_service.SetOptIn: active season: %w", err)
	}
	if season == nil {
		return fmt.Errorf("bad_request: No active season available to opt in/out")
	}

	if err := s.repo.SetOptIn(season.ID, userID, optIn); err != nil {
		return fmt.Errorf("ranking_service.SetOptIn: save: %w", err)
	}

	return nil
}
