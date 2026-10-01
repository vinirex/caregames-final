package repositories

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/caregames/api/internal/models"
	"github.com/jmoiron/sqlx"
)

// UserRepository handles database operations for users, API keys, and profiles.
type UserRepository struct {
	db *sqlx.DB
}

// NewUserRepository creates a new UserRepository.
func NewUserRepository(db *sqlx.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create inserts a new user and returns the created record.
func (r *UserRepository) Create(email, passwordHash string, age int) (*models.User, error) {
	query := `
		INSERT INTO users (email, password_hash, age)
		VALUES ($1, $2, $3)
		RETURNING id, email, password_hash, age, role, is_active, created_at, updated_at`

	var u models.User
	if err := r.db.QueryRowx(query, email, passwordHash, age).StructScan(&u); err != nil {
		return nil, fmt.Errorf("user_repo.Create: %w", err)
	}
	return &u, nil
}

// FindByEmail returns a user by their email address.
func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var u models.User
	err := r.db.QueryRowx(
		`SELECT id, email, password_hash, age, role, is_active, created_at, updated_at
		 FROM users WHERE email = $1 AND is_active = TRUE`, email,
	).StructScan(&u)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("user_repo.FindByEmail: %w", err)
	}
	return &u, nil
}

// FindByID returns a user by their UUID.
func (r *UserRepository) FindByID(id string) (*models.User, error) {
	var u models.User
	err := r.db.QueryRowx(
		`SELECT id, email, password_hash, age, role, is_active, created_at, updated_at
		 FROM users WHERE id = $1 AND is_active = TRUE`, id,
	).StructScan(&u)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("user_repo.FindByID: %w", err)
	}
	return &u, nil
}

// ================================
// API Keys
// ================================

// CreateAPIKey stores a new API key for a user.
func (r *UserRepository) CreateAPIKey(userID, apiKey, label string) (*models.UserAPIKey, error) {
	query := `
		INSERT INTO user_api_keys (user_id, api_key, label)
		VALUES ($1, $2, $3)
		RETURNING id, user_id, api_key, label, last_used_at, expires_at, is_active, created_at`

	var k models.UserAPIKey
	labelVal := sql.NullString{String: label, Valid: label != ""}
	if err := r.db.QueryRowx(query, userID, apiKey, labelVal).StructScan(&k); err != nil {
		return nil, fmt.Errorf("user_repo.CreateAPIKey: %w", err)
	}
	return &k, nil
}

// FindByAPIKey looks up the user associated with an active API key and updates last_used_at.
func (r *UserRepository) FindByAPIKey(apiKey string) (*models.User, error) {
	query := `
		SELECT u.id, u.email, u.password_hash, u.age, u.role, u.is_active, u.created_at, u.updated_at
		FROM users u
		JOIN user_api_keys k ON k.user_id = u.id
		WHERE k.api_key = $1
		  AND k.is_active = TRUE
		  AND u.is_active = TRUE
		  AND (k.expires_at IS NULL OR k.expires_at > NOW())`

	var u models.User
	err := r.db.QueryRowx(query, apiKey).StructScan(&u)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("user_repo.FindByAPIKey: %w", err)
	}

	// Update last_used_at asynchronously (best-effort)
	_, _ = r.db.Exec(
		`UPDATE user_api_keys SET last_used_at = $1 WHERE api_key = $2`,
		time.Now(), apiKey,
	)

	return &u, nil
}

// ListAPIKeys returns all active API keys for a user (without exposing the key value).
func (r *UserRepository) ListAPIKeys(userID string) ([]models.UserAPIKey, error) {
	var keys []models.UserAPIKey
	err := r.db.Select(&keys,
		`SELECT id, user_id, '' AS api_key, label, last_used_at, expires_at, is_active, created_at
		 FROM user_api_keys WHERE user_id = $1 AND is_active = TRUE ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("user_repo.ListAPIKeys: %w", err)
	}
	return keys, nil
}

// RevokeAPIKey deactivates an API key owned by the given user.
func (r *UserRepository) RevokeAPIKey(userID, keyID string) error {
	result, err := r.db.Exec(
		`UPDATE user_api_keys SET is_active = FALSE WHERE id = $1 AND user_id = $2`,
		keyID, userID,
	)
	if err != nil {
		return fmt.Errorf("user_repo.RevokeAPIKey: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("user_repo.RevokeAPIKey: key not found")
	}
	return nil
}

// ================================
// Profiles
// ================================

// CreateProfile initialises an empty profile row for a new user.
func (r *UserRepository) CreateProfile(userID string) error {
	_, err := r.db.Exec(
		`INSERT INTO user_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
		userID,
	)
	if err != nil {
		return fmt.Errorf("user_repo.CreateProfile: %w", err)
	}
	return nil
}

// GetProfile returns the profile for the given user.
func (r *UserRepository) GetProfile(userID string) (*models.UserProfile, error) {
	var p models.UserProfile
	err := r.db.QueryRowx(
		`SELECT id, user_id, name, birthday, address, photo_url, theme_pref, created_at, updated_at
		 FROM user_profiles WHERE user_id = $1`, userID,
	).StructScan(&p)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("user_repo.GetProfile: %w", err)
	}
	return &p, nil
}

// UpdateProfile updates editable profile fields.
func (r *UserRepository) UpdateProfile(userID, name, birthday, address, themePref string) error {
	var birthdayVal interface{}
	if birthday != "" {
		birthdayVal = birthday
	}
	_, err := r.db.Exec(`
		UPDATE user_profiles
		SET name       = COALESCE(NULLIF($2, ''), name),
		    birthday   = COALESCE($3, birthday),
		    address    = COALESCE(NULLIF($4, ''), address),
		    theme_pref = COALESCE(NULLIF($5, ''), theme_pref),
		    updated_at = NOW()
		WHERE user_id = $1`,
		userID, name, birthdayVal, address, themePref,
	)
	if err != nil {
		return fmt.Errorf("user_repo.UpdateProfile: %w", err)
	}
	return nil
}

// ================================
// Points
// ================================

// CreatePoints initialises the points row for a new user.
func (r *UserRepository) CreatePoints(userID string) error {
	_, err := r.db.Exec(
		`INSERT INTO user_points (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
		userID,
	)
	return err
}

// GetPoints returns the current points balance for a user.
func (r *UserRepository) GetPoints(userID string) (*models.UserPoints, error) {
	var p models.UserPoints
	err := r.db.QueryRowx(
		`SELECT id, user_id, balance, total_earned, total_spent, updated_at
		 FROM user_points WHERE user_id = $1`, userID,
	).StructScan(&p)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("user_repo.GetPoints: %w", err)
	}
	return &p, nil
}
