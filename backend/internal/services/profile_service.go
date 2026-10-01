package services

import (
	"fmt"

	"github.com/caregames/api/internal/models"
	"github.com/caregames/api/internal/repositories"
)

// ProfileService manages user profile operations.
type ProfileService struct {
	userRepo *repositories.UserRepository
}

// NewProfileService creates a new ProfileService.
func NewProfileService(userRepo *repositories.UserRepository) *ProfileService {
	return &ProfileService{userRepo: userRepo}
}

// UpdateProfileInput holds fields the user can update on their profile.
type UpdateProfileInput struct {
	Name      string `json:"name"`
	Birthday  string `json:"birthday"`   // "YYYY-MM-DD"
	Address   string `json:"address"`
	ThemePref string `json:"theme_pref"` // "dark" | "light"
}

// GetProfile returns a user's profile, creating a default one if absent.
func (s *ProfileService) GetProfile(userID string) (*models.UserProfile, error) {
	profile, err := s.userRepo.GetProfile(userID)
	if err != nil {
		return nil, fmt.Errorf("profile_service.GetProfile: %w", err)
	}
	if profile == nil {
		// Auto-create on first access
		if err := s.userRepo.CreateProfile(userID); err != nil {
			return nil, fmt.Errorf("profile_service.GetProfile: create: %w", err)
		}
		profile, err = s.userRepo.GetProfile(userID)
		if err != nil {
			return nil, fmt.Errorf("profile_service.GetProfile: re-fetch: %w", err)
		}
	}
	return profile, nil
}

// UpdateProfile saves updated profile fields for a user.
func (s *ProfileService) UpdateProfile(userID string, input UpdateProfileInput) error {
	if input.ThemePref != "" && input.ThemePref != "dark" && input.ThemePref != "light" {
		return fmt.Errorf("invalid_theme: theme_pref must be 'dark' or 'light'")
	}
	return s.userRepo.UpdateProfile(
		userID,
		input.Name,
		input.Birthday,
		input.Address,
		input.ThemePref,
	)
}
