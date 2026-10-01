package repositories

import (
	"database/sql"
	"fmt"

	"github.com/caregames/api/internal/models"
	"github.com/jmoiron/sqlx"
)

// GroupRepository handles DB operations for groups.
type GroupRepository struct {
	db *sqlx.DB
}

// NewGroupRepository creates a new GroupRepository.
func NewGroupRepository(db *sqlx.DB) *GroupRepository {
	return &GroupRepository{db: db}
}

// Create inserts a new group and returns its ID and InviteCode.
func (r *GroupRepository) Create(g *models.Group) error {
	query := `
		INSERT INTO groups (name, description, is_public, max_members, owner_id, invite_code)
		VALUES (:name, :description, :is_public, :max_members, :owner_id, :invite_code)
		RETURNING id, created_at, updated_at
	`
	rows, err := r.db.NamedQuery(query, g)
	if err != nil {
		return fmt.Errorf("group_repo.Create: %w", err)
	}
	defer rows.Close()
	if rows.Next() {
		_ = rows.Scan(&g.ID, &g.CreatedAt, &g.UpdatedAt)
	}
	return nil
}

// AddMember adds a user to a group.
func (r *GroupRepository) AddMember(groupID, userID, role string) error {
	query := `
		INSERT INTO group_members (group_id, user_id, role)
		VALUES ($1, $2, $3)
		ON CONFLICT (group_id, user_id) DO NOTHING
	`
	_, err := r.db.Exec(query, groupID, userID, role)
	if err != nil {
		return fmt.Errorf("group_repo.AddMember: %w", err)
	}
	return nil
}

// GetByID returns a group by ID.
func (r *GroupRepository) GetByID(id string) (*models.Group, error) {
	var g models.Group
	query := `SELECT * FROM groups WHERE id = $1`
	if err := r.db.Get(&g, query, id); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("group_repo.GetByID: %w", err)
	}
	return &g, nil
}

// GetByInviteCode returns a group by its invite code.
func (r *GroupRepository) GetByInviteCode(code string) (*models.Group, error) {
	var g models.Group
	query := `SELECT * FROM groups WHERE invite_code = $1`
	if err := r.db.Get(&g, query, code); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("group_repo.GetByInviteCode: %w", err)
	}
	return &g, nil
}

// ListUserGroups returns all groups a user belongs to.
func (r *GroupRepository) ListUserGroups(userID string) ([]models.Group, error) {
	var groups []models.Group
	query := `
		SELECT g.*
		FROM groups g
		JOIN group_members gm ON g.id = gm.group_id
		WHERE gm.user_id = $1
		ORDER BY g.created_at DESC
	`
	if err := r.db.Select(&groups, query, userID); err != nil {
		return nil, fmt.Errorf("group_repo.ListUserGroups: %w", err)
	}
	return groups, nil
}

// ListPublic returns all public groups.
func (r *GroupRepository) ListPublic() ([]models.Group, error) {
	var groups []models.Group
	query := `SELECT * FROM groups WHERE is_public = true ORDER BY created_at DESC LIMIT 50`
	if err := r.db.Select(&groups, query); err != nil {
		return nil, fmt.Errorf("group_repo.ListPublic: %w", err)
	}
	return groups, nil
}

// RemoveMember removes a user from a group.
func (r *GroupRepository) RemoveMember(groupID, userID string) error {
	query := `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`
	_, err := r.db.Exec(query, groupID, userID)
	if err != nil {
		return fmt.Errorf("group_repo.RemoveMember: %w", err)
	}
	return nil
}

// Delete removes a group.
func (r *GroupRepository) Delete(id string) error {
	query := `DELETE FROM groups WHERE id = $1`
	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("group_repo.Delete: %w", err)
	}
	return nil
}

// GetRanking returns the ranking of members in a group.
func (r *GroupRepository) GetRanking(groupID string) ([]models.GroupRankingEntry, error) {
	var ranking []models.GroupRankingEntry
	query := `
		SELECT 
			ROW_NUMBER() OVER(ORDER BY COALESCE(up.balance, 0) DESC) as rank,
			u.id as user_id,
			p.name as name,
			COALESCE(up.balance, 0) as points
		FROM group_members gm
		JOIN users u ON gm.user_id = u.id
		LEFT JOIN user_profiles p ON u.id = p.user_id
		LEFT JOIN user_points up ON u.id = up.user_id
		WHERE gm.group_id = $1
		ORDER BY points DESC
	`
	if err := r.db.Select(&ranking, query, groupID); err != nil {
		return nil, fmt.Errorf("group_repo.GetRanking: %w", err)
	}
	return ranking, nil
}
