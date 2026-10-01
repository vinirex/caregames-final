package apikey

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
)

const (
	// Prefix is prepended to all generated API keys.
	Prefix = "cgk_"
	// ByteLength is the number of random bytes (produces 64 hex chars).
	ByteLength = 32
)

// Generate creates a new random API key in the format: cgk_{64 hex chars}
// Returns the plaintext key (shown once to the user) and an error if any.
func Generate() (string, error) {
	b := make([]byte, ByteLength)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("apikey: failed to generate random bytes: %w", err)
	}
	return Prefix + hex.EncodeToString(b), nil
}

// IsValid performs a basic format check on an API key.
func IsValid(key string) bool {
	if len(key) != len(Prefix)+ByteLength*2 {
		return false
	}
	if key[:len(Prefix)] != Prefix {
		return false
	}
	_, err := hex.DecodeString(key[len(Prefix):])
	return err == nil
}
