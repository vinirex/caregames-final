package tests

import (
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
)

// ── POST /api/v1/auth/register ──────────────────────────────────────────────

func TestRegister_Success(t *testing.T) {
	e := newTestServer(t)
	body := map[string]interface{}{
		"email":    "joao@test.com",
		"password": "Senha123",
		"age":      25,
	}
	w := doRequest(t, e, http.MethodPost, "/api/v1/auth/register", body, nil)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	parseBody(t, w, &resp)

	if resp["success"] != true {
		t.Errorf("expected success=true, got %v", resp["success"])
	}
	data, ok := resp["data"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected data object in response")
	}
	if data["user_id"] == "" || data["user_id"] == nil {
		t.Error("expected non-empty user_id in response")
	}
}

func TestRegister_DuplicateEmail(t *testing.T) {
	e := newTestServer(t)
	body := map[string]interface{}{
		"email": "dup@test.com", "password": "Senha123", "age": 20,
	}
	doRequest(t, e, http.MethodPost, "/api/v1/auth/register", body, nil)
	w := doRequest(t, e, http.MethodPost, "/api/v1/auth/register", body, nil)

	if w.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d: %s", w.Code, w.Body.String())
	}
}

func TestRegister_WeakPassword(t *testing.T) {
	e := newTestServer(t)
	body := map[string]interface{}{
		"email": "user@test.com", "password": "abc", "age": 20,
	}
	w := doRequest(t, e, http.MethodPost, "/api/v1/auth/register", body, nil)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestRegister_UnderAge(t *testing.T) {
	e := newTestServer(t)
	body := map[string]interface{}{
		"email": "young@test.com", "password": "Senha123", "age": 17,
	}
	w := doRequest(t, e, http.MethodPost, "/api/v1/auth/register", body, nil)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for underage, got %d: %s", w.Code, w.Body.String())
	}
}

func TestRegister_InvalidEmail(t *testing.T) {
	e := newTestServer(t)
	body := map[string]interface{}{
		"email": "notanemail", "password": "Senha123", "age": 25,
	}
	w := doRequest(t, e, http.MethodPost, "/api/v1/auth/register", body, nil)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid email, got %d", w.Code)
	}
}

// ── POST /api/v1/auth/login ──────────────────────────────────────────────────

func TestLogin_Success(t *testing.T) {
	e := newTestServer(t)
	registerUser(t, e, "login@test.com", "Senha123", 25)

	w := doRequest(t, e, http.MethodPost, "/api/v1/auth/login",
		map[string]interface{}{"email": "login@test.com", "password": "Senha123"}, nil)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	parseBody(t, w, &resp)
	data := resp["data"].(map[string]interface{})

	if _, ok := data["api_key"]; !ok {
		t.Error("expected api_key in login response")
	}
}

func TestLogin_WrongPassword(t *testing.T) {
	e := newTestServer(t)
	registerUser(t, e, "wp@test.com", "Senha123", 25)

	w := doRequest(t, e, http.MethodPost, "/api/v1/auth/login",
		map[string]interface{}{"email": "wp@test.com", "password": "WrongPass1"}, nil)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestLogin_UnknownEmail(t *testing.T) {
	e := newTestServer(t)
	w := doRequest(t, e, http.MethodPost, "/api/v1/auth/login",
		map[string]interface{}{"email": "ghost@test.com", "password": "Senha123"}, nil)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

// ── GET /api/v1/auth/me ──────────────────────────────────────────────────────

func TestMe_Authenticated(t *testing.T) {
	e := newTestServer(t)
	apiKey := registerAndLogin(t, e, "me@test.com", "Senha123", 30)

	w := doRequest(t, e, http.MethodGet, "/api/v1/auth/me", nil, authHeader(apiKey))
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	parseBody(t, w, &resp)
	data := resp["data"].(map[string]interface{})
	if data["email"] != "me@test.com" {
		t.Errorf("expected email me@test.com, got %v", data["email"])
	}
}

func TestMe_NoKey(t *testing.T) {
	e := newTestServer(t)
	w := doRequest(t, e, http.MethodGet, "/api/v1/auth/me", nil, nil)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestMe_InvalidKey(t *testing.T) {
	e := newTestServer(t)
	w := doRequest(t, e, http.MethodGet, "/api/v1/auth/me", nil, authHeader("cgk_invalid"))
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

// ── Helpers ─────────────────────────────────────────────────────────────────

// registerUser registers a new user (ignores response).
func registerUser(t *testing.T, e *gin.Engine, email, password string, age int) {
	t.Helper()
	doRequest(t, e, http.MethodPost, "/api/v1/auth/register",
		map[string]interface{}{"email": email, "password": password, "age": age}, nil)
}

// registerAndLogin creates a user and returns a valid API key.
func registerAndLogin(t *testing.T, e *gin.Engine, email, password string, age int) string {
	t.Helper()
	registerUser(t, e, email, password, age)

	w := doRequest(t, e, http.MethodPost, "/api/v1/auth/login",
		map[string]interface{}{"email": email, "password": password}, nil)
	if w.Code != http.StatusOK {
		t.Fatalf("registerAndLogin: login failed: %s", w.Body.String())
	}

	var resp map[string]interface{}
	parseBody(t, w, &resp)
	data, ok := resp["data"].(map[string]interface{})
	if !ok {
		t.Fatalf("registerAndLogin: missing data in login response")
	}
	key, _ := data["api_key"].(string)
	if key == "" {
		t.Fatalf("registerAndLogin: empty api_key in login response")
	}
	return key
}
