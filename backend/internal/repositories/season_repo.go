package repositories

import (
	"database/sql"
	"fmt"

	"github.com/caregames/api/internal/models"
	"github.com/jmoiron/sqlx"
)

// SeasonRepository handles season database operations.
type SeasonRepository struct {
	db *sqlx.DB
}

// NewSeasonRepository creates a new repository.
func NewSeasonRepository(db *sqlx.DB) *SeasonRepository {
	return &SeasonRepository{db: db}
}

// Create inserts a new season.
func (r *SeasonRepository) Create(s *models.Season) error {
	query := `
		INSERT INTO seasons (name, description, starts_at, ends_at, is_active, created_by)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`
	err := r.db.QueryRow(query, s.Name, s.Description, s.StartsAt, s.EndsAt, s.IsActive, s.CreatedBy).
		Scan(&s.ID, &s.CreatedAt)
	if err != nil {
		return fmt.Errorf("season_repo.Create: %w", err)
	}
	return nil
}

// GetByID returns a season by ID.
func (r *SeasonRepository) GetByID(id string) (*models.Season, error) {
	var s models.Season
	query := `SELECT * FROM seasons WHERE id = $1`
	err := r.db.Get(&s, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("season_repo.GetByID: %w", err)
	}
	return &s, nil
}

// GetActive returns the currently active season.
func (r *SeasonRepository) GetActive() (*models.Season, error) {
	var s models.Season
	query := `SELECT * FROM seasons WHERE is_active = true ORDER BY created_at DESC LIMIT 1`
	err := r.db.Get(&s, query)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("season_repo.GetActive: %w", err)
	}
	return &s, nil
}

// List returns all seasons.
func (r *SeasonRepository) List() ([]models.Season, error) {
	var seasons []models.Season
	query := `SELECT * FROM seasons ORDER BY starts_at DESC`
	if err := r.db.Select(&seasons, query); err != nil {
		return nil, fmt.Errorf("season_repo.List: %w", err)
	}
	return seasons, nil
}

// Update modifies an existing season.
func (r *SeasonRepository) Update(s *models.Season) error {
	query := `
		UPDATE seasons
		SET name = $1, description = $2, starts_at = $3, ends_at = $4, is_active = $5
		WHERE id = $6
	`
	_, err := r.db.Exec(query, s.Name, s.Description, s.StartsAt, s.EndsAt, s.IsActive, s.ID)
	if err != nil {
		return fmt.Errorf("season_repo.Update: %w", err)
	}
	return nil
}

// Delete removes a season.
func (r *SeasonRepository) Delete(id string) error {
	query := `DELETE FROM seasons WHERE id = $1`
	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("season_repo.Delete: %w", err)
	}
	return nil
}

// SetActive makes a specific season active and deactivates others.
func (r *SeasonRepository) SetActive(id string) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return fmt.Errorf("season_repo.SetActive: begin tx: %w", err)
	}
	defer tx.Rollback()

	// Deactivate all
	_, err = tx.Exec(`UPDATE seasons SET is_active = false`)
	if err != nil {
		return fmt.Errorf("season_repo.SetActive: deactivate all: %w", err)
	}

	// Activate target
	_, err = tx.Exec(`UPDATE seasons SET is_active = true WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("season_repo.SetActive: activate target: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("season_repo.SetActive: commit: %w", err)
	}

	return nil
}
