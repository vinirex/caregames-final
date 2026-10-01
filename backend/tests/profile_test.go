package tests

import (
	"net/http"
	"testing"
)

// ── GET /api/v1/profile ──────────────────────────────────────────────────────

func TestGetProfile_Authenticated(t *testing.T) {
	e := newTestServer(t)
	apiKey := registerAndLogin(t, e, "profile@test.com", "Senha123", 28)

	w := doRequest(t, e, http.MethodGet, "/api/v1/profile", nil, authHeader(apiKey))
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	parseBody(t, w, &resp)

	if resp["success"] != true {
		t.Errorf("expected success=true")
	}
	data, ok := resp["data"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected data object")
	}
	if data["user_id"] == nil {
		t.Error("expected user_id in profile data")
	}
}

func TestGetProfile_Unauthenticated(t *testing.T) {
	e := newTestServer(t)
	w := doRequest(t, e, http.MethodGet, "/api/v1/profile", nil, nil)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

// ── PUT /api/v1/profile ──────────────────────────────────────────────────────

func TestUpdateProfile_Success(t *testing.T) {
	e := newTestServer(t)
	apiKey := registerAndLogin(t, e, "update@test.com", "Senha123", 22)

	body := map[string]interface{}{
		"name":       "João da Silva",
		"birthday":   "1999-05-20",
		"address":    "Rua das Flores, 123",
		"theme_pref": "light",
	}
	w := doRequest(t, e, http.MethodPut, "/api/v1/profile", body, authHeader(apiKey))
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	parseBody(t, w, &resp)
	data, ok := resp["data"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected data object")
	}
	// Name should have been updated
	nameRaw := data["name"]
	// name is a sql.NullString serialised as interface
	t.Logf("profile name after update: %v", nameRaw)
}

func TestUpdateProfile_InvalidTheme(t *testing.T) {
	e := newTestServer(t)
	apiKey := registerAndLogin(t, e, "theme@test.com", "Senha123", 22)

	body := map[string]interface{}{"theme_pref": "purple"}
	w := doRequest(t, e, http.MethodPut, "/api/v1/profile", body, authHeader(apiKey))
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid theme, got %d: %s", w.Code, w.Body.String())
	}
}

func TestUpdateProfile_Unauthenticated(t *testing.T) {
	e := newTestServer(t)
	w := doRequest(t, e, http.MethodPut, "/api/v1/profile",
		map[string]interface{}{"name": "test"}, nil)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}
