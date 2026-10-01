package models

import "time"

// SeasonCreate is used to create or update a season.
type SeasonCreate struct {
	Name        string    `json:"name" binding:"required"`
	Description string    `json:"description"`
	StartsAt    time.Time `json:"starts_at" binding:"required"`
	EndsAt      time.Time `json:"ends_at" binding:"required"`
}
