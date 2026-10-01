package apikey_test

import (
	"strings"
	"testing"

	"github.com/caregames/api/pkg/apikey"
)

func TestGenerate_Format(t *testing.T) {
	key, err := apikey.Generate()
	if err != nil {
		t.Fatalf("Generate returned error: %v", err)
	}
	if !strings.HasPrefix(key, apikey.Prefix) {
		t.Errorf("expected prefix %q, got %q", apikey.Prefix, key[:len(apikey.Prefix)])
	}
	expectedLen := len(apikey.Prefix) + apikey.ByteLength*2
	if len(key) != expectedLen {
		t.Errorf("expected key length %d, got %d", expectedLen, len(key))
	}
}

func TestGenerate_Unique(t *testing.T) {
	k1, _ := apikey.Generate()
	k2, _ := apikey.Generate()
	if k1 == k2 {
		t.Error("two generated keys should not be equal")
	}
}

func TestIsValid_ValidKey(t *testing.T) {
	key, _ := apikey.Generate()
	if !apikey.IsValid(key) {
		t.Errorf("expected valid key to pass IsValid, got false for %q", key)
	}
}

func TestIsValid_InvalidKeys(t *testing.T) {
	cases := []string{
		"",
		"cgk_short",
		"bad_prefix_" + strings.Repeat("a", 64),
		"cgk_" + strings.Repeat("z", 64), // z is valid hex? no: z is not hex
		"cgk_" + strings.Repeat("g", 64), // g is not valid hex
	}
	for _, tc := range cases {
		if apikey.IsValid(tc) {
			t.Errorf("expected IsValid(%q) = false", tc)
		}
	}
}
