package crypto

import "golang.org/x/crypto/bcrypt"

// DefaultCost is the bcrypt work factor.
const DefaultCost = 12

// HashPassword hashes a plaintext password using bcrypt.
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), DefaultCost)
	return string(bytes), err
}

// CheckPassword verifies a plaintext password against a bcrypt hash.
func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
