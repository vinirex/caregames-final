package crypto_test

import (
	"testing"

	"github.com/caregames/api/pkg/crypto"
)

func TestHashPassword_NotEmpty(t *testing.T) {
	hash, err := crypto.HashPassword("Senha123")
	if err != nil {
		t.Fatalf("HashPassword error: %v", err)
	}
	if hash == "" {
		t.Error("expected non-empty hash")
	}
	if hash == "Senha123" {
		t.Error("hash should not equal plaintext")
	}
}

func TestHashPassword_DifferentEachTime(t *testing.T) {
	h1, _ := crypto.HashPassword("Senha123")
	h2, _ := crypto.HashPassword("Senha123")
	if h1 == h2 {
		t.Error("bcrypt should produce different hashes due to random salt")
	}
}

func TestCheckPassword_Correct(t *testing.T) {
	hash, _ := crypto.HashPassword("Senha123")
	if !crypto.CheckPassword("Senha123", hash) {
		t.Error("CheckPassword should return true for correct password")
	}
}

func TestCheckPassword_Wrong(t *testing.T) {
	hash, _ := crypto.HashPassword("Senha123")
	if crypto.CheckPassword("WrongPass", hash) {
		t.Error("CheckPassword should return false for wrong password")
	}
}

func TestCheckPassword_EmptyPassword(t *testing.T) {
	hash, _ := crypto.HashPassword("Senha123")
	if crypto.CheckPassword("", hash) {
		t.Error("CheckPassword should return false for empty password")
	}
}
