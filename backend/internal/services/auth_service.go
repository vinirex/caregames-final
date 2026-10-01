package services

import (
	"fmt"
	"regexp"
	"unicode"

	"github.com/caregames/api/internal/models"
	"github.com/caregames/api/internal/repositories"
	"github.com/caregames/api/pkg/apikey"
	"github.com/caregames/api/pkg/crypto"
)

// AuthService handles registration, login, and API key lifecycle.
type AuthService struct {
	userRepo *repositories.UserRepository
}

// NewAuthService creates a new AuthService.
func NewAuthService(userRepo *repositories.UserRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

// RegisterInput holds the data required to register a new user.
type RegisterInput struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Age      int    `json:"age"      binding:"required,min=18"`
}

// LoginInput holds the credentials for logging in.
type LoginInput struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// RegisterResult is returned after a successful registration.
type RegisterResult struct {
	UserID  string `json:"user_id"`
	Message string `json:"message"`
}

// LoginResult is returned after a successful login.
type LoginResult struct {
	APIKey string      `json:"api_key"`
	User   *models.User `json:"user"`
}

// Register creates a new user account.
func (s *AuthService) Register(input RegisterInput) (*RegisterResult, error) {
	// Validate password strength
	if err := validatePassword(input.Password); err != nil {
		return nil, err
	}

	// Check for duplicate email
	existing, err := s.userRepo.FindByEmail(input.Email)
	if err != nil {
		return nil, fmt.Errorf("auth_service.Register: %w", err)
	}
	if existing != nil {
		return nil, fmt.Errorf("email_taken: e-mail já está em uso")
	}

	// Hash password
	hash, err := crypto.HashPassword(input.Password)
	if err != nil {
		return nil, fmt.Errorf("auth_service.Register: hash: %w", err)
	}

	// Create user
	user, err := s.userRepo.Create(input.Email, hash, input.Age)
	if err != nil {
		return nil, fmt.Errorf("auth_service.Register: create user: %w", err)
	}

	// Initialise linked rows
	_ = s.userRepo.CreateProfile(user.ID)
	_ = s.userRepo.CreatePoints(user.ID)

	return &RegisterResult{
		UserID:  user.ID,
		Message: "Usuário cadastrado com sucesso",
	}, nil
}

// Login validates credentials and returns a new API key.
func (s *AuthService) Login(input LoginInput) (*LoginResult, error) {
	user, err := s.userRepo.FindByEmail(input.Email)
	if err != nil {
		return nil, fmt.Errorf("auth_service.Login: %w", err)
	}
	if user == nil || !crypto.CheckPassword(input.Password, user.PasswordHash) {
		return nil, fmt.Errorf("invalid_credentials: e-mail ou senha inválidos")
	}

	// Generate and store a new API key
	key, err := apikey.Generate()
	if err != nil {
		return nil, fmt.Errorf("auth_service.Login: generate key: %w", err)
	}

	if _, err = s.userRepo.CreateAPIKey(user.ID, key, ""); err != nil {
		return nil, fmt.Errorf("auth_service.Login: store key: %w", err)
	}

	return &LoginResult{APIKey: key, User: user}, nil
}

// GetMe returns the authenticated user.
func (s *AuthService) GetMe(userID string) (*models.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, fmt.Errorf("auth_service.GetMe: %w", err)
	}
	return user, nil
}

// Logout deactivates the supplied API key.
func (s *AuthService) Logout(userID, keyID string) error {
	return s.userRepo.RevokeAPIKey(userID, keyID)
}

// validatePassword enforces: ≥8 chars, 1 uppercase, 1 lowercase, 1 digit.
func validatePassword(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("weak_password: a senha deve ter pelo menos 8 caracteres")
	}
	var hasUpper, hasLower, hasDigit bool
	for _, r := range password {
		switch {
		case unicode.IsUpper(r):
			hasUpper = true
		case unicode.IsLower(r):
			hasLower = true
		case unicode.IsDigit(r):
			hasDigit = true
		}
	}
	if !hasUpper || !hasLower || !hasDigit {
		return fmt.Errorf("weak_password: a senha deve conter letras maiúsculas, minúsculas e números")
	}
	return nil
}

// emailRegex is used by the handler layer for quick format checks.
var emailRegex = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)

// ValidEmail reports whether s looks like a valid e-mail address.
func ValidEmail(s string) bool { return emailRegex.MatchString(s) }
