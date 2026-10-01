package services

import (
	"fmt"
	"strings"

	"github.com/caregames/api/internal/models"
	"github.com/caregames/api/internal/repositories"
)

// PointsService manages points balance and transaction history.
type PointsService struct {
	pointsRepo *repositories.PointsRepository
	userRepo   *repositories.UserRepository
}

// NewPointsService creates a new PointsService.
func NewPointsService(pointsRepo *repositories.PointsRepository, userRepo *repositories.UserRepository) *PointsService {
	return &PointsService{pointsRepo: pointsRepo, userRepo: userRepo}
}

// GetBalance returns the current points summary for a user.
func (s *PointsService) GetBalance(userID string) (*models.UserPoints, error) {
	pts, err := s.pointsRepo.GetBalance(userID)
	if err != nil {
		return nil, fmt.Errorf("points_service.GetBalance: %w", err)
	}
	if pts == nil {
		// Auto-create points row on first access
		if err := s.userRepo.CreatePoints(userID); err != nil {
			return nil, fmt.Errorf("points_service.GetBalance: create: %w", err)
		}
		pts, err = s.pointsRepo.GetBalance(userID)
		if err != nil {
			return nil, fmt.Errorf("points_service.GetBalance: re-fetch: %w", err)
		}
	}
	return pts, nil
}

// AddPoints credits points to a user and records the transaction.
func (s *PointsService) AddPoints(userID string, amount int, reason, refID, refType string) (int, error) {
	if amount <= 0 {
		return 0, fmt.Errorf("invalid_amount: amount must be positive")
	}
	newBalance, err := s.pointsRepo.AddPoints(userID, amount, reason, refID, refType)
	if err != nil {
		return 0, fmt.Errorf("points_service.AddPoints: %w", err)
	}
	return newBalance, nil
}

// SpendPoints debits points from a user, enforcing a sufficient balance.
func (s *PointsService) SpendPoints(userID string, amount int, reason, refID, refType string) (int, error) {
	if amount <= 0 {
		return 0, fmt.Errorf("invalid_amount: amount must be positive")
	}
	newBalance, err := s.pointsRepo.SpendPoints(userID, amount, reason, refID, refType)
	if err != nil {
		if strings.HasPrefix(err.Error(), "insufficient_points") {
			return 0, err // pass through to handler for 422
		}
		return 0, fmt.Errorf("points_service.SpendPoints: %w", err)
	}
	return newBalance, nil
}

// ListTransactions returns paginated point transaction history.
func (s *PointsService) ListTransactions(userID string, limit, offset int) ([]models.PointTransaction, int64, error) {
	txs, total, err := s.pointsRepo.ListTransactions(userID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("points_service.ListTransactions: %w", err)
	}
	return txs, total, nil
}
