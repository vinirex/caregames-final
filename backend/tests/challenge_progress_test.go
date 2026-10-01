package tests

import (
	"net/http"
	"testing"
)

func TestUpdateProgress_Success(t *testing.T) {
	e := newTestServer(t)
	apiKey := registerAndLogin(t, e, "prog@test.com", "Senha123", 25)

	// Step 1: List and find a challenge
	wList := doRequest(t, e, http.MethodGet, "/api/v1/challenges", nil, authHeader(apiKey))
	var respList map[string]interface{}
	parseBody(t, wList, &respList)
	data, _ := respList["data"].([]interface{})
	firstChall := data[0].(map[string]interface{})
	challID := firstChall["id"].(string)

	// Step 2: Accept it
	doRequest(t, e, http.MethodPost, "/api/v1/challenges/"+challID+"/accept", nil, authHeader(apiKey))

	// Step 3: Update progress
	reqBody := map[string]interface{}{"current_value": 5000.0}
	wProg := doRequest(t, e, http.MethodPut, "/api/v1/challenges/"+challID+"/progress", reqBody, authHeader(apiKey))
	
	if wProg.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", wProg.Code, wProg.Body.String())
	}

	// Verify progress
	wList2 := doRequest(t, e, http.MethodGet, "/api/v1/challenges", nil, authHeader(apiKey))
	var respList2 map[string]interface{}
	parseBody(t, wList2, &respList2)
	data2, _ := respList2["data"].([]interface{})
	var found map[string]interface{}
	for _, c := range data2 {
		ch := c.(map[string]interface{})
		if ch["id"] == challID {
			found = ch
			break
		}
	}
	prog := found["progress"].(map[string]interface{})
	val := prog["current_value"].(float64)
	if val != 5000 {
		t.Errorf("expected current_value 5000, got %v", prog["current_value"])
	}
}

func TestCompleteChallenge_Success(t *testing.T) {
	e := newTestServer(t)
	apiKey := registerAndLogin(t, e, "comp@test.com", "Senha123", 25)

	// List -> Pick -> Accept -> Set Progress enough to complete -> Complete
	wList := doRequest(t, e, http.MethodGet, "/api/v1/challenges", nil, authHeader(apiKey))
	var respList map[string]interface{}
	parseBody(t, wList, &respList)
	data, _ := respList["data"].([]interface{})
	firstChall := data[0].(map[string]interface{})
	challID := firstChall["id"].(string)
	target := firstChall["target_value"].(float64)

	doRequest(t, e, http.MethodPost, "/api/v1/challenges/"+challID+"/accept", nil, authHeader(apiKey))
	
	reqBody := map[string]interface{}{"current_value": target}
	doRequest(t, e, http.MethodPut, "/api/v1/challenges/"+challID+"/progress", reqBody, authHeader(apiKey))

	wComp := doRequest(t, e, http.MethodPost, "/api/v1/challenges/"+challID+"/complete", nil, authHeader(apiKey))
	if wComp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", wComp.Code, wComp.Body.String())
	}

	// Verify status is completed
	wList2 := doRequest(t, e, http.MethodGet, "/api/v1/challenges", nil, authHeader(apiKey))
	var respList2 map[string]interface{}
	parseBody(t, wList2, &respList2)
	data2, _ := respList2["data"].([]interface{})
	var found map[string]interface{}
	for _, c := range data2 {
		ch := c.(map[string]interface{})
		if ch["id"] == challID {
			found = ch
			break
		}
	}
	prog := found["progress"].(map[string]interface{})
	if prog["status"] != "completed" {
		t.Errorf("expected status completed, got %v", prog["status"])
	}
}
