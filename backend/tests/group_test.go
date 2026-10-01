package tests

import (
	"net/http"
	"testing"
)

func TestGroups_Success(t *testing.T) {
	e := newTestServer(t)

	// User 1
	ownerKey := registerAndLogin(t, e, "owner@group.com", "Senha123", 30)

	// Create Group
	createPayload := map[string]interface{}{
		"name":        "Grupo Teste",
		"description": "Um grupo de teste",
		"is_public":   true,
	}
	wCreate := doRequest(t, e, http.MethodPost, "/api/v1/groups", createPayload, authHeader(ownerKey))
	if wCreate.Code != http.StatusOK {
		t.Fatalf("failed to create group: %s", wCreate.Body.String())
	}
	var respCreate map[string]interface{}
	parseBody(t, wCreate, &respCreate)
	groupData := respCreate["data"].(map[string]interface{})
	inviteCode := groupData["invite_code"].(string)
	groupID := groupData["id"].(string)

	// User 2
	memberKey := registerAndLogin(t, e, "member@group.com", "Senha123", 28)

	// Join Group
	joinPayload := map[string]interface{}{
		"invite_code": inviteCode,
	}
	wJoin := doRequest(t, e, http.MethodPost, "/api/v1/groups/join", joinPayload, authHeader(memberKey))
	if wJoin.Code != http.StatusOK {
		t.Fatalf("failed to join group: %s", wJoin.Body.String())
	}

	// List User 2 Groups
	wList := doRequest(t, e, http.MethodGet, "/api/v1/groups", nil, authHeader(memberKey))
	var respList map[string]interface{}
	parseBody(t, wList, &respList)
	listData := respList["data"].([]interface{})
	if len(listData) != 1 {
		t.Fatalf("expected 1 group for member")
	}

	// Get Ranking
	wRank := doRequest(t, e, http.MethodGet, "/api/v1/groups/"+groupID+"/ranking", nil, authHeader(ownerKey))
	var respRank map[string]interface{}
	parseBody(t, wRank, &respRank)
	var rankData []interface{}
	if respRank["data"] != nil {
		rankMap := respRank["data"].(map[string]interface{})
		if rankMap["ranking"] != nil {
			rankData = rankMap["ranking"].([]interface{})
		}
	}
	if len(rankData) != 2 {
		t.Fatalf("expected 2 members in ranking, got %d, body: %s", len(rankData), wRank.Body.String())
	}

	// Member leaves group
	wLeave := doRequest(t, e, http.MethodPost, "/api/v1/groups/"+groupID+"/leave", nil, authHeader(memberKey))
	if wLeave.Code != http.StatusOK {
		t.Fatalf("failed to leave group: %s", wLeave.Body.String())
	}
}
