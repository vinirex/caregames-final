package services

import (
	"fmt"

	"github.com/caregames/api/internal/models"
	"github.com/caregames/api/internal/repositories"
)

// ChallengeService manages business logic for challenges.
type ChallengeService struct {
	repo *repositories.ChallengeRepository
}

// NewChallengeService creates a new ChallengeService.
func NewChallengeService(repo *repositories.ChallengeRepository) *ChallengeService {
	return &ChallengeService{repo: repo}
}

// ChallengeWithProgress combines a challenge with a user's specific progress.
type ChallengeWithProgress struct {
	models.Challenge
	Progress *models.UserChallengeProgress `json:"progress"` // can be nil if not started
}

// ListActiveForUser returns all active challenges and attaches the user's progress if available.
func (s *ChallengeService) ListActiveForUser(userID string) ([]ChallengeWithProgress, error) {
	challenges, err := s.repo.ListActive()
	if err != nil {
		return nil, fmt.Errorf("challenge_service.ListActiveForUser: %w", err)
	}

	result := make([]ChallengeWithProgress, 0, len(challenges))
	for _, c := range challenges {
		prog, err := s.repo.GetUserProgress(userID, c.ID)
		if err != nil {
			return nil, fmt.Errorf("challenge_service.ListActiveForUser: fetch progress %s: %w", c.ID, err)
		}
		result = append(result, ChallengeWithProgress{
			Challenge: c,
			Progress:  prog,
		})
	}
	return result, nil
}

// AcceptChallenge starts tracking progress for a user on a specific challenge.
func (s *ChallengeService) AcceptChallenge(userID, challengeID string) error {
	c, err := s.repo.GetByID(challengeID)
	if err != nil {
		return fmt.Errorf("challenge_service.AcceptChallenge: fetch: %w", err)
	}
	if c == nil || !c.IsActive {
		return fmt.Errorf("not_found: challenge not found or inactive")
	}

	prog, err := s.repo.GetUserProgress(userID, challengeID)
	if err != nil {
		return fmt.Errorf("challenge_service.AcceptChallenge: check progress: %w", err)
	}
	if prog != nil {
		return fmt.Errorf("conflict: challenge already accepted")
	}

	if err := s.repo.CreateProgress(userID, challengeID); err != nil {
		return fmt.Errorf("challenge_service.AcceptChallenge: %w", err)
	}

	return nil
}
