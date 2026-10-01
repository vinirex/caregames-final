package services

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"

	"github.com/caregames/api/internal/models"
	"github.com/caregames/api/internal/repositories"
)

// GroupService handles business logic for groups.
type GroupService struct {
	repo *repositories.GroupRepository
}

// NewGroupService creates a new GroupService.
func NewGroupService(repo *repositories.GroupRepository) *GroupService {
	return &GroupService{repo: repo}
}

// CreateGroup creates a new group and adds the owner as a member.
func (s *GroupService) CreateGroup(userID string, g *models.Group) (*models.Group, error) {
	// Generate an invite code
	codeBytes := make([]byte, 4)
	rand.Read(codeBytes)
	g.InviteCode = strings.ToUpper(hex.EncodeToString(codeBytes))
	g.OwnerID = userID
	if g.MaxMembers == 0 {
		g.MaxMembers = 50
	}

	if err := s.repo.Create(g); err != nil {
		return nil, fmt.Errorf("group_service.CreateGroup: %w", err)
	}

	// Add owner as a member
	if err := s.repo.AddMember(g.ID, userID, "owner"); err != nil {
		return nil, fmt.Errorf("group_service.CreateGroup: add owner: %w", err)
	}

	return g, nil
}

// ListUserGroups returns all groups a user belongs to.
func (s *GroupService) ListUserGroups(userID string) ([]models.Group, error) {
	groups, err := s.repo.ListUserGroups(userID)
	if err != nil {
		return nil, fmt.Errorf("group_service.ListUserGroups: %w", err)
	}
	return groups, nil
}

// ListPublic returns public groups.
func (s *GroupService) ListPublic() ([]models.Group, error) {
	groups, err := s.repo.ListPublic()
	if err != nil {
		return nil, fmt.Errorf("group_service.ListPublic: %w", err)
	}
	return groups, nil
}

// JoinGroup processes a join request using an invite code.
func (s *GroupService) JoinGroup(userID, inviteCode string) error {
	g, err := s.repo.GetByInviteCode(inviteCode)
	if err != nil {
		return fmt.Errorf("group_service.JoinGroup: fetch group: %w", err)
	}
	if g == nil {
		return fmt.Errorf("not_found: group not found with this code")
	}

	// In a real system, you'd check member count vs MaxMembers here.

	if err := s.repo.AddMember(g.ID, userID, "member"); err != nil {
		return fmt.Errorf("group_service.JoinGroup: add member: %w", err)
	}
	return nil
}

// LeaveGroup processes a leave request.
func (s *GroupService) LeaveGroup(userID, groupID string) error {
	// Check if user is owner. If so, they might need to delete the group or transfer ownership.
	// For simplicity, we just allow leave.
	return s.repo.RemoveMember(groupID, userID)
}

// GetRanking returns the ranking for a group.
func (s *GroupService) GetRanking(groupID string) ([]models.GroupRankingEntry, error) {
	ranking, err := s.repo.GetRanking(groupID)
	if err != nil {
		return nil, fmt.Errorf("group_service.GetRanking: %w", err)
	}
	return ranking, nil
}
