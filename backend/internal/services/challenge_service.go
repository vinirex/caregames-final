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

// UpdateProgress updates the value of an ongoing challenge.
func (s *ChallengeService) UpdateProgress(userID, challengeID string, value float64) error {
	if err := s.repo.UpdateProgress(userID, challengeID, value); err != nil {
		return fmt.Errorf("challenge_service.UpdateProgress: %w", err)
	}
	return nil
}

// CompleteChallenge marks a challenge as completed and awards points.
// Note: In a real system you'd use a DB transaction across these operations.
func (s *ChallengeService) CompleteChallenge(userID, challengeID string, pointsSvc *PointsService, notifSvc *NotificationService) (int, error) {
	c, err := s.repo.GetByID(challengeID)
	if err != nil {
		return 0, fmt.Errorf("challenge_service.CompleteChallenge: fetch: %w", err)
	}
	if c == nil {
		return 0, fmt.Errorf("not_found: challenge not found")
	}

	prog, err := s.repo.GetUserProgress(userID, challengeID)
	if err != nil {
		return 0, fmt.Errorf("challenge_service.CompleteChallenge: check progress: %w", err)
	}
	if prog == nil || prog.Status != "in_progress" {
		return 0, fmt.Errorf("bad_request: challenge not in progress")
	}

	// For simplicity, we assume the client ensures target is met, or we can check here:
	if prog.CurrentValue < c.TargetValue {
		return 0, fmt.Errorf("bad_request: target not reached yet")
	}

	if err := s.repo.UpdateStatus(userID, challengeID, c.PointsReward); err != nil {
		return 0, fmt.Errorf("challenge_service.CompleteChallenge: status update: %w", err)
	}

	// Award points
	desc := fmt.Sprintf("Conclusão do desafio: %s", c.Title)
	if _, err := pointsSvc.AddPoints(userID, c.PointsReward, desc, challengeID, "challenge"); err != nil {
		return 0, fmt.Errorf("challenge_service.CompleteChallenge: award points: %w", err)
	}

	// Send notification (ignore errors so we don't fail the completion if notifs fail)
	if notifSvc != nil {
		msg := fmt.Sprintf("Você ganhou +%d PTS por concluir %q.", c.PointsReward, c.Title)
		_ = notifSvc.Create(userID, "Desafio Concluído! 🎉", msg, "emoji-events")
	}

	return c.PointsReward, nil
}
