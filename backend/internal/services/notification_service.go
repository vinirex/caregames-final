package services

import (
	"fmt"

	"github.com/caregames/api/internal/models"
	"github.com/caregames/api/internal/repositories"
)

// NotificationService handles logic for notifications.
type NotificationService struct {
	repo *repositories.NotificationRepository
}

// NewNotificationService creates a new service.
func NewNotificationService(repo *repositories.NotificationRepository) *NotificationService {
	return &NotificationService{repo: repo}
}

// List returns user notifications and unread count.
func (s *NotificationService) List(userID string) ([]models.Notification, int, error) {
	notifs, err := s.repo.List(userID)
	if err != nil {
		return nil, 0, fmt.Errorf("notification_svc.List: %w", err)
	}
	unread, err := s.repo.CountUnread(userID)
	if err != nil {
		return nil, 0, fmt.Errorf("notification_svc.List.Count: %w", err)
	}
	return notifs, unread, nil
}

// GetUnreadCount returns just the count.
func (s *NotificationService) GetUnreadCount(userID string) (int, error) {
	return s.repo.CountUnread(userID)
}

// MarkAsRead marks one as read.
func (s *NotificationService) MarkAsRead(id, userID string) error {
	return s.repo.MarkAsRead(id, userID)
}

// MarkAllAsRead marks all as read.
func (s *NotificationService) MarkAllAsRead(userID string) error {
	return s.repo.MarkAllAsRead(userID)
}

// Delete removes one.
func (s *NotificationService) Delete(id, userID string) error {
	return s.repo.Delete(id, userID)
}

// DeleteRead removes all read.
func (s *NotificationService) DeleteRead(userID string) error {
	return s.repo.DeleteRead(userID)
}

// Create is a helper for other services to send notifications.
func (s *NotificationService) Create(userID, title, message, icon string) error {
	return s.repo.Create(&models.Notification{
		UserID:   userID,
		Title:    title,
		Message:  message,
		IconName: &icon,
	})
}
