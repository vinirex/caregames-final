package tests

import (
	"fmt"
	"net/http"
	"testing"
)

// ── GET /api/v1/points ───────────────────────────────────────────────────────

func TestGetPoints_InitialBalance(t *testing.T) {
	e := newTestServer(t)
	apiKey := registerAndLogin(t, e, "pts@test.com", "Senha123", 25)

	w := doRequest(t, e, http.MethodGet, "/api/v1/points", nil, authHeader(apiKey))
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	parseBody(t, w, &resp)
	data, ok := resp["data"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected data object")
	}
	balance, _ := data["balance"].(float64)
	if balance != 0 {
		t.Errorf("expected initial balance=0, got %v", balance)
	}
}

func TestGetPoints_Unauthenticated(t *testing.T) {
	e := newTestServer(t)
	w := doRequest(t, e, http.MethodGet, "/api/v1/points", nil, nil)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

// ── POST /api/v1/points/spend ────────────────────────────────────────────────

func TestSpendPoints_InsufficientBalance(t *testing.T) {
	e := newTestServer(t)
	apiKey := registerAndLogin(t, e, "spend@test.com", "Senha123", 25)

	body := map[string]interface{}{"amount": 500, "reason": "test spend"}
	w := doRequest(t, e, http.MethodPost, "/api/v1/points/spend", body, authHeader(apiKey))
	if w.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422 for insufficient points, got %d: %s", w.Code, w.Body.String())
	}
}

func TestSpendPoints_ZeroAmount(t *testing.T) {
	e := newTestServer(t)
	apiKey := registerAndLogin(t, e, "zero@test.com", "Senha123", 25)

	body := map[string]interface{}{"amount": 0, "reason": "zero"}
	w := doRequest(t, e, http.MethodPost, "/api/v1/points/spend", body, authHeader(apiKey))
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for zero amount, got %d", w.Code)
	}
}

// ── GET /api/v1/points/history ───────────────────────────────────────────────

func TestPointsHistory_Empty(t *testing.T) {
	e := newTestServer(t)
	apiKey := registerAndLogin(t, e, "hist@test.com", "Senha123", 25)

	w := doRequest(t, e, http.MethodGet, "/api/v1/points/history", nil, authHeader(apiKey))
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	parseBody(t, w, &resp)
	data, _ := resp["data"].([]interface{})
	if len(data) != 0 {
		t.Errorf("expected empty transactions, got %d", len(data))
	}

	pagination, ok := resp["pagination"].(map[string]interface{})
	if !ok {
		t.Fatal("expected pagination object")
	}
	total, _ := pagination["total"].(float64)
	if total != 0 {
		t.Errorf("expected total=0, got %v", total)
	}
}

func TestPointsHistory_Pagination(t *testing.T) {
	e := newTestServer(t)
	w := doRequest(t, e, http.MethodGet, "/api/v1/points/history?page=abc", nil,
		authHeader(registerAndLogin(t, e, "page@test.com", "Senha123", 25)))
	// page=abc is non-numeric, Gin's ShouldBindQuery returns an error → 400 Bad Request
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 with invalid page param, got %d", w.Code)
	}
}

// ── POST /api/v1/points/add (admin only) ─────────────────────────────────────

func TestAddPoints_NonAdmin_Forbidden(t *testing.T) {
	e := newTestServer(t)
	apiKey := registerAndLogin(t, e, "nonadmin@test.com", "Senha123", 25)

	body := map[string]interface{}{"amount": 100, "reason": "bonus"}
	w := doRequest(t, e, http.MethodPost, "/api/v1/points/add", body, authHeader(apiKey))
	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for non-admin, got %d: %s", w.Code, w.Body.String())
	}
}

// ── Health check ─────────────────────────────────────────────────────────────

func TestHealthCheck(t *testing.T) {
	e := newTestServer(t)
	w := doRequest(t, e, http.MethodGet, "/health", nil, nil)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 from health check, got %d: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	parseBody(t, w, &resp)
	if resp["status"] != "ok" {
		t.Errorf("expected status=ok, got %v", resp["status"])
	}
}

// suppress unused import warning
var _ = fmt.Sprintf
