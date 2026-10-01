package models

import "time"

// Group represents a community of users.
type Group struct {
	ID          string    `db:"id"          json:"id"`
	Name        string    `db:"name"        json:"name"`
	Description *string   `db:"description" json:"description"`
	AvatarURL   *string   `db:"avatar_url"  json:"avatar_url"`
	InviteCode  string    `db:"invite_code" json:"invite_code"`
	OwnerID     string    `db:"owner_id"    json:"owner_id"`
	IsPublic    bool      `db:"is_public"   json:"is_public"`
	MaxMembers  int       `db:"max_members" json:"max_members"`
	CreatedAt   time.Time `db:"created_at"  json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at"  json:"updated_at"`
}

// GroupMember represents a user's membership in a group.
type GroupMember struct {
	ID       string    `db:"id"        json:"id"`
	GroupID  string    `db:"group_id"  json:"group_id"`
	UserID   string    `db:"user_id"   json:"user_id"`
	Role     string    `db:"role"      json:"role"` // 'owner', 'admin', 'member'
	JoinedAt time.Time `db:"joined_at" json:"joined_at"`
}

// GroupRankingEntry represents a user in a group ranking.
type GroupRankingEntry struct {
	Rank   int    `db:"rank"    json:"rank"`
	UserID string `db:"user_id" json:"user_id"`
	Name   *string `db:"name"    json:"name"`
	Points int    `db:"points"  json:"points"`
}
