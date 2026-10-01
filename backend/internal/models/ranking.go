package models

import "time"

// Season represents a competitive period.
type Season struct {
	ID          string    `db:"id"          json:"id"`
	Name        string    `db:"name"        json:"name"`
	Description *string   `db:"description" json:"description"`
	StartsAt    time.Time `db:"starts_at"   json:"starts_at"`
	EndsAt      time.Time `db:"ends_at"     json:"ends_at"`
	IsActive    bool      `db:"is_active"   json:"is_active"`
	CreatedBy   *string   `db:"created_by"  json:"created_by"`
	CreatedAt   time.Time `db:"created_at"  json:"created_at"`
}

// SeasonRanking represents a user's position in a season.
type SeasonRanking struct {
	ID             string    `db:"id"              json:"id"`
	SeasonID       string    `db:"season_id"       json:"season_id"`
	UserID         string    `db:"user_id"         json:"user_id"`
	PointsSnapshot int       `db:"points_snapshot" json:"points_snapshot"`
	RankPosition   *int      `db:"rank_position"   json:"rank_position"`
	OptIn          bool      `db:"opt_in"          json:"opt_in"`
	UpdatedAt      time.Time `db:"updated_at"      json:"updated_at"`
}

// GlobalRankingEntry represents a user in the global leaderboard.
type GlobalRankingEntry struct {
	Rank          int     `json:"rank"            db:"rank"`
	UserID        string  `json:"user_id"         db:"user_id"`
	Name          *string `json:"name"            db:"name"`
	AvatarURL     *string `json:"avatar_url"      db:"avatar_url"`
	Initials      *string `json:"initials"        db:"initials"`
	Points        int     `json:"points"          db:"points"`
	IsCurrentUser bool    `json:"is_current_user" db:"-"` // Added at runtime
}

// GlobalRankingResponse is the response structure for the global leaderboard.
type GlobalRankingResponse struct {
	Season      *Season              `json:"season"`
	Leaderboard []GlobalRankingEntry `json:"leaderboard"`
	CurrentUser *CurrentUserRank     `json:"current_user"`
}

// CurrentUserRank represents the current user's ranking details.
type CurrentUserRank struct {
	Rank   int  `json:"rank"`
	Points int  `json:"points"`
	OptIn  bool `json:"opt_in"`
}
