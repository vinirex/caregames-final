package tests

import (
	"net/http"
	"testing"
)

func TestListBenefits_Success(t *testing.T) {
	e := newTestServer(t)
	apiKey := registerAndLogin(t, e, "listben@test.com", "Senha123", 30)

	w := doRequest(t, e, http.MethodGet, "/api/v1/benefits", nil, authHeader(apiKey))
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp map[string]interface{}
	parseBody(t, w, &resp)

	data := resp["data"].([]interface{})
	if len(data) == 0 {
		t.Fatalf("expected at least one benefit")
	}
}

func TestRedeemBenefit_Success(t *testing.T) {
	e := newTestServer(t)
	apiKey := registerAndLogin(t, e, "redeem@test.com", "Senha123", 25)

	// List benefits to find one
	wList := doRequest(t, e, http.MethodGet, "/api/v1/benefits", nil, authHeader(apiKey))
	var respList map[string]interface{}
	parseBody(t, wList, &respList)
	data := respList["data"].([]interface{})
	firstBen := data[0].(map[string]interface{})
	benID := firstBen["id"].(string)

	// User has 0 points initially. Redeem should fail
	wFail := doRequest(t, e, http.MethodPost, "/api/v1/benefits/"+benID+"/redeem", nil, authHeader(apiKey))
	if wFail.Code != http.StatusBadRequest { // insufficient points -> 400 or 422
		t.Fatalf("expected 400 for insufficient points, got %d: %s", wFail.Code, wFail.Body.String())
	}

	// Add points as Admin to user (requires getting user ID, or we can use admin to add points)
	// For testing, let's just create an admin, or we can call the service directly.
	// Since we don't have a direct AddPoints endpoint for users, we need to authenticate as admin.
	// Actually, let's just make the user complete a challenge first.
	wChall := doRequest(t, e, http.MethodGet, "/api/v1/challenges", nil, authHeader(apiKey))
	var respChall map[string]interface{}
	parseBody(t, wChall, &respChall)
	cdata := respChall["data"].([]interface{})
	chall := cdata[0].(map[string]interface{})
	cID := chall["id"].(string)
	target := chall["target_value"].(float64)

	doRequest(t, e, http.MethodPost, "/api/v1/challenges/"+cID+"/accept", nil, authHeader(apiKey))
	doRequest(t, e, http.MethodPut, "/api/v1/challenges/"+cID+"/progress", map[string]interface{}{"current_value": target}, authHeader(apiKey))
	wComp := doRequest(t, e, http.MethodPost, "/api/v1/challenges/"+cID+"/complete", nil, authHeader(apiKey))
	if wComp.Code != http.StatusOK {
		t.Fatalf("failed to complete challenge: %s", wComp.Body.String())
	}
	
	// Now try redeeming
	wSucc := doRequest(t, e, http.MethodPost, "/api/v1/benefits/"+benID+"/redeem", nil, authHeader(apiKey))
	if wSucc.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", wSucc.Code, wSucc.Body.String())
	}
}
