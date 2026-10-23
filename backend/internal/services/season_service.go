package services

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/caregames/api/internal/models"
	"github.com/caregames/api/internal/repositories"
)

// SeasonService handles season logic and challenge orchestration.
type SeasonService struct {
	repo          *repositories.SeasonRepository
	challengeRepo *repositories.ChallengeRepository
	aiSvc         *AIService
}

// NewSeasonService creates a new SeasonService.
func NewSeasonService(
	repo *repositories.SeasonRepository,
	challengeRepo *repositories.ChallengeRepository,
	aiSvc *AIService,
) *SeasonService {
	return &SeasonService{
		repo:          repo,
		challengeRepo: challengeRepo,
		aiSvc:         aiSvc,
	}
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

	// Generate 5 seasonal challenges for the new season via AI
	if s.aiSvc != nil && s.challengeRepo != nil {
		prevJSON := s.getPreviousChallengesJSON()
		challenges, err := s.aiSvc.GenerateSeasonalChallenges(season, prevJSON)
		if err != nil {
			log.Printf("⚠️ Warning generating challenges on season create: %v", err)
		} else {
			for i := range challenges {
				if err := s.challengeRepo.Create(&challenges[i]); err != nil {
					log.Printf("⚠️ Error inserting AI challenge on create: %v", err)
				}
			}
			log.Printf("✅ Created %d seasonal challenges for season %s", len(challenges), season.Name)
		}
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

// ActivateSeason makes a season active and generates 5 seasonal challenges with AI.
func (s *SeasonService) ActivateSeason(id string) error {
	season, err := s.repo.GetByID(id)
	if err != nil {
		return fmt.Errorf("season_service.ActivateSeason: get: %w", err)
	}
	if season == nil {
		return fmt.Errorf("not_found: season not found")
	}

	// 1. Activate the season in DB (and deactivate others)
	if err := s.repo.SetActive(id); err != nil {
		return fmt.Errorf("season_service.ActivateSeason: %w", err)
	}
	season.IsActive = true

	// 2. Manage seasonal challenges
	if s.challengeRepo != nil {
		// Deactivate seasonal challenges from previous seasons
		if err := s.challengeRepo.DeactivateOtherSeasonalChallenges(id); err != nil {
			log.Printf("⚠️ Warning deactivating other seasonal challenges: %v", err)
		}

		// Check if challenges already exist for this season
		existing, err := s.challengeRepo.ListBySeasonID(id)
		if err == nil && len(existing) > 0 {
			// Reactivate existing challenges
			if err := s.challengeRepo.ActivateSeasonalChallenges(id); err != nil {
				log.Printf("⚠️ Warning activating existing seasonal challenges: %v", err)
			}
			log.Printf("✅ Season %s activated with %d existing challenges", season.Name, len(existing))
		} else if s.aiSvc != nil {
			// Generate 5 new seasonal challenges via AI
			log.Printf("🤖 Generating 5 AI challenges for newly activated season: %s", season.Name)
			prevJSON := s.getPreviousChallengesJSON()
			challenges, genErr := s.aiSvc.GenerateSeasonalChallenges(season, prevJSON)
			if genErr != nil {
				log.Printf("⚠️ Warning from AI generator: %v", genErr)
			}

			count := 0
			for i := range challenges {
				if err := s.challengeRepo.Create(&challenges[i]); err != nil {
					log.Printf("⚠️ Error inserting AI challenge %s: %v", challenges[i].Slug, err)
				} else {
					count++
				}
			}
			log.Printf("✅ Season %s activated: created %d AI challenges", season.Name, count)
		}
	}

	return nil
}

// getPreviousChallengesJSON serializes recent challenge summaries to prevent duplicate generation.
func (s *SeasonService) getPreviousChallengesJSON() string {
	if s.challengeRepo == nil {
		return "[]"
	}
	summaries, err := s.challengeRepo.ListSummaries(10)
	if err != nil || len(summaries) == 0 {
		return "[]"
	}
	b, err := json.Marshal(summaries)
	if err != nil {
		return "[]"
	}
	return string(b)
}

// GenerateSeasonChallenges explicitly generates 5 AI challenges for a season.
func (s *SeasonService) GenerateSeasonChallenges(id string) ([]models.Challenge, error) {
	season, err := s.repo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("season_service.GenerateSeasonChallenges: get: %w", err)
	}
	if season == nil {
		return nil, fmt.Errorf("not_found: season not found")
	}

	if s.aiSvc == nil || s.challengeRepo == nil {
		return nil, fmt.Errorf("ai service or challenge repo not configured")
	}

	prevJSON := s.getPreviousChallengesJSON()
	challenges, err := s.aiSvc.GenerateSeasonalChallenges(season, prevJSON)
	if err != nil {
		return nil, fmt.Errorf("season_service.GenerateSeasonChallenges: %w", err)
	}

	var created []models.Challenge
	for i := range challenges {
		if err := s.challengeRepo.Create(&challenges[i]); err != nil {
			log.Printf("⚠️ Error inserting AI challenge %s: %v", challenges[i].Slug, err)
			continue
		}
		created = append(created, challenges[i])
	}

	return created, nil
}


