package tests

import (
	"net/http"
	"testing"
)

// ── GET /api/v1/challenges ───────────────────────────────────────────────────

func TestListChallenges_Success(t *testing.T) {
	e := newTestServer(t)
	apiKey := registerAndLogin(t, e, "chall@test.com", "Senha123", 25)

	w := doRequest(t, e, http.MethodGet, "/api/v1/challenges", nil, authHeader(apiKey))
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	parseBody(t, w, &resp)
	data, ok := resp["data"].([]interface{})
	if !ok {
		t.Fatalf("expected data to be a list")
	}

	// We seed 3 fixed challenges initially in our migrations
	if len(data) < 3 {
		t.Errorf("expected at least 3 fixed challenges seeded, got %d", len(data))
	}

	first, _ := data[0].(map[string]interface{})
	if first["id"] == nil {
		t.Errorf("expected challenge id")
	}
	// Initial state, progress should be null
	if first["progress"] != nil {
		t.Errorf("expected progress to be null initially, got %v", first["progress"])
	}
}

// ── POST /api/v1/challenges/:id/accept ───────────────────────────────────────

func TestAcceptChallenge_Success(t *testing.T) {
	e := newTestServer(t)
	apiKey := registerAndLogin(t, e, "accept@test.com", "Senha123", 25)

	// Step 1: List to find a challenge ID
	wList := doRequest(t, e, http.MethodGet, "/api/v1/challenges", nil, authHeader(apiKey))
	var respList map[string]interface{}
	parseBody(t, wList, &respList)
	data, _ := respList["data"].([]interface{})
	if len(data) == 0 {
		t.Fatalf("no challenges available to accept")
	}
	firstChall := data[0].(map[string]interface{})
	challID := firstChall["id"].(string)

	// Step 2: Accept it
	wAccept := doRequest(t, e, http.MethodPost, "/api/v1/challenges/"+challID+"/accept", nil, authHeader(apiKey))
	if wAccept.Code != http.StatusOK {
		t.Fatalf("expected 200 accepting challenge, got %d: %s", wAccept.Code, wAccept.Body.String())
	}

	// Step 3: Accept again should return 409 Conflict
	wAccept2 := doRequest(t, e, http.MethodPost, "/api/v1/challenges/"+challID+"/accept", nil, authHeader(apiKey))
	if wAccept2.Code != http.StatusConflict {
		t.Fatalf("expected 409 accepting again, got %d", wAccept2.Code)
	}

	// Step 4: List again and verify progress is attached
	wList2 := doRequest(t, e, http.MethodGet, "/api/v1/challenges", nil, authHeader(apiKey))
	var respList2 map[string]interface{}
	parseBody(t, wList2, &respList2)
	data2, _ := respList2["data"].([]interface{})
	
	// find the accepted challenge and check its progress
	var found map[string]interface{}
	for _, c := range data2 {
		ch := c.(map[string]interface{})
		if ch["id"] == challID {
			found = ch
			break
		}
	}
	if found["progress"] == nil {
		t.Fatalf("expected progress attached to accepted challenge")
	}
	prog := found["progress"].(map[string]interface{})
	if prog["status"] != "in_progress" {
		t.Errorf("expected status in_progress, got %v", prog["status"])
	}
}

func TestAcceptChallenge_NotFound(t *testing.T) {
	e := newTestServer(t)
	apiKey := registerAndLogin(t, e, "notfound@test.com", "Senha123", 25)

	w := doRequest(t, e, http.MethodPost, "/api/v1/challenges/00000000-0000-0000-0000-000000000000/accept", nil, authHeader(apiKey))
	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}
