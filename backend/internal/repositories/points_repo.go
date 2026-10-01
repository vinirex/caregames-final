package repositories

import (
	"database/sql"
	"fmt"

	"github.com/caregames/api/internal/models"
	"github.com/jmoiron/sqlx"
)

// PointsRepository handles point balance and transaction operations.
type PointsRepository struct {
	db *sqlx.DB
}

// NewPointsRepository creates a new PointsRepository.
func NewPointsRepository(db *sqlx.DB) *PointsRepository {
	return &PointsRepository{db: db}
}

// GetBalance returns the current points balance for a user.
func (r *PointsRepository) GetBalance(userID string) (*models.UserPoints, error) {
	var p models.UserPoints
	err := r.db.QueryRowx(
		`SELECT id, user_id, balance, total_earned, total_spent, updated_at
		 FROM user_points WHERE user_id = $1`, userID,
	).StructScan(&p)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("points_repo.GetBalance: %w", err)
	}
	return &p, nil
}

// AddPoints atomically credits points and records the transaction.
// Returns the updated balance after the operation.
func (r *PointsRepository) AddPoints(userID string, amount int, reason, refID, refType string) (int, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return 0, fmt.Errorf("points_repo.AddPoints: begin tx: %w", err)
	}
	defer tx.Rollback()

	var newBalance int
	err = tx.QueryRow(`
		UPDATE user_points
		SET balance      = balance + $2,
		    total_earned = total_earned + $2,
		    updated_at   = NOW()
		WHERE user_id = $1
		RETURNING balance`,
		userID, amount,
	).Scan(&newBalance)
	if err != nil {
		return 0, fmt.Errorf("points_repo.AddPoints: update balance: %w", err)
	}

	_, err = tx.Exec(`
		INSERT INTO point_transactions
		    (user_id, amount, type, reason, reference_id, reference_type, balance_after)
		VALUES ($1, $2, 'earned', $3, NULLIF($4,'')::uuid, NULLIF($5,''), $6)`,
		userID, amount, reason, refID, refType, newBalance,
	)
	if err != nil {
		return 0, fmt.Errorf("points_repo.AddPoints: insert tx: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return 0, fmt.Errorf("points_repo.AddPoints: commit: %w", err)
	}
	return newBalance, nil
}

// SpendPoints atomically debits points (with a balance check) and records the transaction.
// Returns the updated balance after the operation, or an error if insufficient funds.
func (r *PointsRepository) SpendPoints(userID string, amount int, reason, refID, refType string) (int, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return 0, fmt.Errorf("points_repo.SpendPoints: begin tx: %w", err)
	}
	defer tx.Rollback()

	// Lock the row and check balance
	var currentBalance int
	err = tx.QueryRow(
		`SELECT balance FROM user_points WHERE user_id = $1 FOR UPDATE`, userID,
	).Scan(&currentBalance)
	if err != nil {
		return 0, fmt.Errorf("points_repo.SpendPoints: lock balance: %w", err)
	}

	if currentBalance < amount {
		return currentBalance, fmt.Errorf("insufficient_points: balance=%d required=%d", currentBalance, amount)
	}

	var newBalance int
	err = tx.QueryRow(`
		UPDATE user_points
		SET balance     = balance - $2,
		    total_spent = total_spent + $2,
		    updated_at  = NOW()
		WHERE user_id = $1
		RETURNING balance`,
		userID, amount,
	).Scan(&newBalance)
	if err != nil {
		return 0, fmt.Errorf("points_repo.SpendPoints: update balance: %w", err)
	}

	_, err = tx.Exec(`
		INSERT INTO point_transactions
		    (user_id, amount, type, reason, reference_id, reference_type, balance_after)
		VALUES ($1, $2, 'spent', $3, NULLIF($4,'')::uuid, NULLIF($5,''), $6)`,
		userID, -amount, reason, refID, refType, newBalance,
	)
	if err != nil {
		return 0, fmt.Errorf("points_repo.SpendPoints: insert tx: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return 0, fmt.Errorf("points_repo.SpendPoints: commit: %w", err)
	}
	return newBalance, nil
}

// ListTransactions returns paginated transaction history for a user.
func (r *PointsRepository) ListTransactions(userID string, limit, offset int) ([]models.PointTransaction, int64, error) {
	var total int64
	if err := r.db.QueryRow(
		`SELECT COUNT(*) FROM point_transactions WHERE user_id = $1`, userID,
	).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("points_repo.ListTransactions: count: %w", err)
	}

	var txs []models.PointTransaction
	err := r.db.Select(&txs, `
		SELECT id, user_id, amount, type, reason, reference_id, reference_type, balance_after, created_at
		FROM point_transactions
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`,
		userID, limit, offset,
	)
	if err != nil {
		return nil, 0, fmt.Errorf("points_repo.ListTransactions: %w", err)
	}
	return txs, total, nil
}
