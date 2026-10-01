package repositories

import (
	"database/sql"
	"fmt"

	"github.com/caregames/api/internal/models"
	"github.com/jmoiron/sqlx"
)

// BenefitRepository handles database operations for benefits.
type BenefitRepository struct {
	db *sqlx.DB
}

// NewBenefitRepository creates a new BenefitRepository.
func NewBenefitRepository(db *sqlx.DB) *BenefitRepository {
	return &BenefitRepository{db: db}
}

// BeginTx starts a new database transaction.
func (r *BenefitRepository) BeginTx() (*sqlx.Tx, error) {
	return r.db.Beginx()
}

// ListActive returns all active benefits.
func (r *BenefitRepository) ListActive() ([]models.Benefit, error) {
	var benefits []models.Benefit
	query := `
		SELECT
			id, title, description, image_url, points_cost, stock,
			is_active, category, partner_name, valid_until, created_by,
			created_at, updated_at
		FROM benefits
		WHERE is_active = true
		ORDER BY created_at DESC
	`
	if err := r.db.Select(&benefits, query); err != nil {
		return nil, fmt.Errorf("benefit_repo.ListActive: %w", err)
	}
	return benefits, nil
}

// GetByID returns a benefit by its ID.
func (r *BenefitRepository) GetByID(id string) (*models.Benefit, error) {
	var b models.Benefit
	query := `
		SELECT
			id, title, description, image_url, points_cost, stock,
			is_active, category, partner_name, valid_until, created_by,
			created_at, updated_at
		FROM benefits
		WHERE id = $1
	`
	if err := r.db.Get(&b, query, id); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("benefit_repo.GetByID: %w", err)
	}
	return &b, nil
}

// CreateRedemption creates a new benefit redemption record.
func (r *BenefitRepository) CreateRedemption(tx *sqlx.Tx, rdm *models.BenefitRedemption) error {
	query := `
		INSERT INTO benefit_redemptions (
			user_id, benefit_id, points_spent, status, voucher_code, redeemed_at
		) VALUES (
			:user_id, :benefit_id, :points_spent, :status, :voucher_code, NOW()
		) RETURNING id, redeemed_at
	`
	// Using tx.NamedQuery to handle struct bindings easily, then reading back the returning fields.
	rows, err := tx.NamedQuery(query, rdm)
	if err != nil {
		return fmt.Errorf("benefit_repo.CreateRedemption: %w", err)
	}
	defer rows.Close()
	if rows.Next() {
		err = rows.Scan(&rdm.ID, &rdm.RedeemedAt)
		if err != nil {
			return fmt.Errorf("benefit_repo.CreateRedemption: scan returning: %w", err)
		}
	}
	return nil
}

// DecrementStock safely decrements the stock of a benefit.
func (r *BenefitRepository) DecrementStock(tx *sqlx.Tx, benefitID string) error {
	query := `
		UPDATE benefits
		SET stock = stock - 1, updated_at = NOW()
		WHERE id = $1 AND stock IS NOT NULL AND stock > 0
	`
	res, err := tx.Exec(query, benefitID)
	if err != nil {
		return fmt.Errorf("benefit_repo.DecrementStock: %w", err)
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("out_of_stock")
	}
	return nil
}

// ListRedemptions returns a user's redemptions.
func (r *BenefitRepository) ListRedemptions(userID string) ([]models.BenefitRedemption, error) {
	var rdms []models.BenefitRedemption
	query := `
		SELECT
			id, user_id, benefit_id, points_spent, status, voucher_code,
			redeemed_at, confirmed_at, notes
		FROM benefit_redemptions
		WHERE user_id = $1
		ORDER BY redeemed_at DESC
	`
	if err := r.db.Select(&rdms, query, userID); err != nil {
		return nil, fmt.Errorf("benefit_repo.ListRedemptions: %w", err)
	}
	return rdms, nil
}
