package models

import "time"

// Notification represents an in-app notification for a user.
type Notification struct {
	ID        string    `db:"id"         json:"id"`
	UserID    string    `db:"user_id"    json:"user_id"`
	Title     string    `db:"title"      json:"title"`
	Message   string    `db:"message"    json:"message"`
	IconName  *string   `db:"icon_name"  json:"icon_name"`
	IconColor *string   `db:"icon_color" json:"icon_color"`
	IsRead    bool      `db:"is_read"    json:"is_read"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}
