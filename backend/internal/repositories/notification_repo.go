package repositories

import (
	"fmt"

	"github.com/caregames/api/internal/models"
	"github.com/jmoiron/sqlx"
)

// NotificationRepository handles db operations for notifications.
type NotificationRepository struct {
	db *sqlx.DB
}

// NewNotificationRepository creates a new repo.
func NewNotificationRepository(db *sqlx.DB) *NotificationRepository {
	return &NotificationRepository{db: db}
}

// Create inserts a new notification.
func (r *NotificationRepository) Create(n *models.Notification) error {
	query := `
		INSERT INTO notifications (user_id, title, message, icon_name, icon_color, created_at)
		VALUES (:user_id, :title, :message, :icon_name, :icon_color, NOW())
		RETURNING id, created_at
	`
	rows, err := r.db.NamedQuery(query, n)
	if err != nil {
		return fmt.Errorf("notification_repo.Create: %w", err)
	}
	defer rows.Close()
	if rows.Next() {
		_ = rows.Scan(&n.ID, &n.CreatedAt)
	}
	return nil
}

// List returns a user's notifications.
func (r *NotificationRepository) List(userID string) ([]models.Notification, error) {
	var notifs []models.Notification
	query := `
		SELECT id, user_id, title, message, icon_name, icon_color, is_read, created_at
		FROM notifications
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 50
	`
	if err := r.db.Select(&notifs, query, userID); err != nil {
		return nil, fmt.Errorf("notification_repo.List: %w", err)
	}
	return notifs, nil
}

// CountUnread returns the number of unread notifications for a user.
func (r *NotificationRepository) CountUnread(userID string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`
	if err := r.db.Get(&count, query, userID); err != nil {
		return 0, fmt.Errorf("notification_repo.CountUnread: %w", err)
	}
	return count, nil
}

// MarkAsRead marks a specific notification as read.
func (r *NotificationRepository) MarkAsRead(id, userID string) error {
	query := `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(query, id, userID)
	if err != nil {
		return fmt.Errorf("notification_repo.MarkAsRead: %w", err)
	}
	return nil
}

// MarkAllAsRead marks all notifications as read for a user.
func (r *NotificationRepository) MarkAllAsRead(userID string) error {
	query := `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`
	_, err := r.db.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("notification_repo.MarkAllAsRead: %w", err)
	}
	return nil
}

// Delete removes a specific notification.
func (r *NotificationRepository) Delete(id, userID string) error {
	query := `DELETE FROM notifications WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(query, id, userID)
	if err != nil {
		return fmt.Errorf("notification_repo.Delete: %w", err)
	}
	return nil
}

// DeleteRead removes all read notifications for a user.
func (r *NotificationRepository) DeleteRead(userID string) error {
	query := `DELETE FROM notifications WHERE user_id = $1 AND is_read = true`
	_, err := r.db.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("notification_repo.DeleteRead: %w", err)
	}
	return nil
}
