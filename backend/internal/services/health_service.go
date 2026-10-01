package services

import (
	"fmt"
	"time"

	"github.com/caregames/api/internal/models"
	"github.com/caregames/api/internal/repositories"
)

// HealthService handles business logic for health sync operations.
type HealthService struct {
	repo         *repositories.HealthRepository
	challengeSvc *ChallengeService
}

// NewHealthService creates a new HealthService.
func NewHealthService(repo *repositories.HealthRepository, challengeSvc *ChallengeService) *HealthService {
	return &HealthService{repo: repo, challengeSvc: challengeSvc}
}

// SyncData saves telemetry and auto-updates relevant active challenges.
func (s *HealthService) SyncData(userID string, rec *models.HealthSyncRecord) error {
	rec.UserID = userID
	
	// Default to today if missing
	if rec.RecordDate == "" {
		rec.RecordDate = time.Now().Format("2006-01-02")
	}
	
	if err := s.repo.SyncRecord(rec); err != nil {
		return fmt.Errorf("health_service.SyncData: %w", err)
	}

	// Example logic: auto-update step challenge
	if rec.Steps != nil {
		active, _ := s.challengeSvc.ListActiveForUser(userID)
		for _, ch := range active {
			// Find daily step challenge in progress
			if ch.Challenge.Metric == "steps" && ch.Challenge.Type == "daily" && ch.Progress != nil && ch.Progress.Status == "in_progress" {
				// We assume progress updates replace the value for the day.
				_ = s.challengeSvc.UpdateProgress(userID, ch.Challenge.ID, float64(*rec.Steps))
			}
		}
	}

	return nil
}

// ListRecords gets historical records.
func (s *HealthService) ListRecords(userID string) ([]models.HealthSyncRecord, error) {
	records, err := s.repo.ListRecords(userID)
	if err != nil {
		return nil, fmt.Errorf("health_service.ListRecords: %w", err)
	}
	return records, nil
}

// GetRecordByDate returns a single date's record.
func (s *HealthService) GetRecordByDate(userID string, dateStr string) (*models.HealthSyncRecord, error) {
	d, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return nil, fmt.Errorf("bad_request: invalid date format (use YYYY-MM-DD)")
	}
	rec, err := s.repo.GetRecordByDate(userID, d)
	if err != nil {
		return nil, fmt.Errorf("health_service.GetRecordByDate: %w", err)
	}
	return rec, nil
}
