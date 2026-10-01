package tests

import (
	"net/http"
	"testing"
	"time"
)

func TestHealthSync_Success(t *testing.T) {
	e := newTestServer(t)
	apiKey := registerAndLogin(t, e, "health@test.com", "Senha123", 25)

	// Accept steps challenge to test auto-update
	wChall := doRequest(t, e, http.MethodGet, "/api/v1/challenges", nil, authHeader(apiKey))
	var respChall map[string]interface{}
	parseBody(t, wChall, &respChall)
	cdata := respChall["data"].([]interface{})
	var stepChallID string
	for _, c := range cdata {
		chall := c.(map[string]interface{})
		if chall["metric"] == "steps" {
			stepChallID = chall["id"].(string)
			break
		}
	}

	if stepChallID != "" {
		doRequest(t, e, http.MethodPost, "/api/v1/challenges/"+stepChallID+"/accept", nil, authHeader(apiKey))
	}

	today := time.Now().Format("2006-01-02T00:00:00Z")

	syncPayload := map[string]interface{}{
		"record_date":    today,
		"steps":          5500,
		"heart_rate_bpm": 72,
		"temperature_c":  36.5,
		"platform":       "apple_health",
	}

	wSync := doRequest(t, e, http.MethodPost, "/api/v1/health/sync", syncPayload, authHeader(apiKey))
	if wSync.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", wSync.Code, wSync.Body.String())
	}

	// 2. Verify Record created
	wList := doRequest(t, e, http.MethodGet, "/api/v1/health/records", nil, authHeader(apiKey))
	var respList map[string]interface{}
	parseBody(t, wList, &respList)
	rdata := respList["data"].([]interface{})
	if len(rdata) == 0 {
		t.Fatalf("expected at least 1 record")
	}

	firstRec := rdata[0].(map[string]interface{})
	if firstRec["steps"] == nil {
		t.Errorf("expected steps to be non-nil, got %v", firstRec["steps"])
	} else if int(firstRec["steps"].(float64)) != 5500 {
		t.Errorf("expected 5500 steps, got %v", firstRec["steps"])
	}

	// 3. Verify Challenge Progress Auto-updated
	if stepChallID != "" {
		wChall2 := doRequest(t, e, http.MethodGet, "/api/v1/challenges", nil, authHeader(apiKey))
		var respChall2 map[string]interface{}
		parseBody(t, wChall2, &respChall2)
		cdata2 := respChall2["data"].([]interface{})
		for _, c := range cdata2 {
			chall := c.(map[string]interface{})
			if chall["id"] == stepChallID {
				prog := chall["progress"].(map[string]interface{})
				if int(prog["current_value"].(float64)) != 5500 {
					t.Errorf("expected challenge progress 5500, got %v", prog["current_value"])
				}
			}
		}
	}
}
