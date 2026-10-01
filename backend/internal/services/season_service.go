package services

import (
	"fmt"

	"github.com/caregames/api/internal/models"
	"github.com/caregames/api/internal/repositories"
)

// SeasonService handles season logic.
type SeasonService struct {
	repo *repositories.SeasonRepository
}

// NewSeasonService creates a new SeasonService.
func NewSeasonService(repo *repositories.SeasonRepository) *SeasonService {
	return &SeasonService{repo: repo}
}

// CreateSeason validates and creates a new season.
func (s *SeasonService) CreateSeason(req models.SeasonCreate, userID string) (*models.Season, error) {
	if req.StartsAt.After(req.EndsAt) {
		return nil, fmt.Errorf("bad_request: starts_at must be before ends_at")
	}

	season := &models.Season{
		Name:        req.Name,
		Description: &req.Description,
		StartsAt:    req.StartsAt,
		EndsAt:      req.EndsAt,
		IsActive:    false, // Must be activated explicitly
		CreatedBy:   &userID,
	}

	if err := s.repo.Create(season); err != nil {
		return nil, fmt.Errorf("season_service.CreateSeason: %w", err)
	}

	return season, nil
}

// List returns all seasons.
func (s *SeasonService) List() ([]models.Season, error) {
	seasons, err := s.repo.List()
	if err != nil {
		return nil, fmt.Errorf("season_service.List: %w", err)
	}
	return seasons, nil
}

// GetActive returns the active season.
func (s *SeasonService) GetActive() (*models.Season, error) {
	season, err := s.repo.GetActive()
	if err != nil {
		return nil, fmt.Errorf("season_service.GetActive: %w", err)
	}
	return season, nil
}

// GetByID returns a season by ID.
func (s *SeasonService) GetByID(id string) (*models.Season, error) {
	season, err := s.repo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("season_service.GetByID: %w", err)
	}
	if season == nil {
		return nil, fmt.Errorf("not_found: season not found")
	}
	return season, nil
}

// UpdateSeason modifies an existing season.
func (s *SeasonService) UpdateSeason(id string, req models.SeasonCreate) (*models.Season, error) {
	season, err := s.repo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("season_service.UpdateSeason: get: %w", err)
	}
	if season == nil {
		return nil, fmt.Errorf("not_found: season not found")
	}

	if req.StartsAt.After(req.EndsAt) {
		return nil, fmt.Errorf("bad_request: starts_at must be before ends_at")
	}

	season.Name = req.Name
	season.Description = &req.Description
	season.StartsAt = req.StartsAt
	season.EndsAt = req.EndsAt

	if err := s.repo.Update(season); err != nil {
		return nil, fmt.Errorf("season_service.UpdateSeason: %w", err)
	}

	return season, nil
}

// DeleteSeason removes a season.
func (s *SeasonService) DeleteSeason(id string) error {
	return s.repo.Delete(id)
}

// ActivateSeason makes a season active.
func (s *SeasonService) ActivateSeason(id string) error {
	if err := s.repo.SetActive(id); err != nil {
		return fmt.Errorf("season_service.ActivateSeason: %w", err)
	}
	return nil
}
