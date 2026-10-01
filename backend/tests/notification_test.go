package tests

import (
	"net/http"
	"testing"
)

func TestNotifications_Success(t *testing.T) {
	e := newTestServer(t)
	apiKey := registerAndLogin(t, e, "notif@test.com", "Senha123", 25)

	// User should have 0 unread
	wUnread1 := doRequest(t, e, http.MethodGet, "/api/v1/notifications/unread-count", nil, authHeader(apiKey))
	var unreadResp1 map[string]interface{}
	parseBody(t, wUnread1, &unreadResp1)
	if int(unreadResp1["data"].(map[string]interface{})["unread_count"].(float64)) != 0 {
		t.Fatalf("expected 0 unread")
	}

	// Trigger a notification by completing a challenge
	wChall := doRequest(t, e, http.MethodGet, "/api/v1/challenges", nil, authHeader(apiKey))
	var respChall map[string]interface{}
	parseBody(t, wChall, &respChall)
	cdata := respChall["data"].([]interface{})
	chall := cdata[0].(map[string]interface{})
	cID := chall["id"].(string)
	target := chall["target_value"].(float64)

	doRequest(t, e, http.MethodPost, "/api/v1/challenges/"+cID+"/accept", nil, authHeader(apiKey))
	doRequest(t, e, http.MethodPut, "/api/v1/challenges/"+cID+"/progress", map[string]interface{}{"current_value": target}, authHeader(apiKey))
	doRequest(t, e, http.MethodPost, "/api/v1/challenges/"+cID+"/complete", nil, authHeader(apiKey))

	// Should have 1 unread notification now (from challenge completion)
	wUnread2 := doRequest(t, e, http.MethodGet, "/api/v1/notifications/unread-count", nil, authHeader(apiKey))
	var unreadResp2 map[string]interface{}
	parseBody(t, wUnread2, &unreadResp2)
	if int(unreadResp2["data"].(map[string]interface{})["unread_count"].(float64)) != 1 {
		t.Fatalf("expected 1 unread notification after challenge completion")
	}

	// List notifications
	wList := doRequest(t, e, http.MethodGet, "/api/v1/notifications", nil, authHeader(apiKey))
	var respList map[string]interface{}
	parseBody(t, wList, &respList)
	notifList := respList["data"].(map[string]interface{})["notifications"].([]interface{})
	if len(notifList) != 1 {
		t.Fatalf("expected 1 notification in list")
	}

	notifID := notifList[0].(map[string]interface{})["id"].(string)

	// Mark as read
	doRequest(t, e, http.MethodPut, "/api/v1/notifications/"+notifID+"/read", nil, authHeader(apiKey))

	// Should be 0 unread
	wUnread3 := doRequest(t, e, http.MethodGet, "/api/v1/notifications/unread-count", nil, authHeader(apiKey))
	var unreadResp3 map[string]interface{}
	parseBody(t, wUnread3, &unreadResp3)
	if int(unreadResp3["data"].(map[string]interface{})["unread_count"].(float64)) != 0 {
		t.Fatalf("expected 0 unread after marking as read")
	}

	// Delete read
	doRequest(t, e, http.MethodDelete, "/api/v1/notifications/read", nil, authHeader(apiKey))

	// List should be empty
	wList2 := doRequest(t, e, http.MethodGet, "/api/v1/notifications", nil, authHeader(apiKey))
	var respList2 map[string]interface{}
	parseBody(t, wList2, &respList2)
	notifsData := respList2["data"].(map[string]interface{})["notifications"]
	if notifsData != nil {
		notifList2 := notifsData.([]interface{})
		if len(notifList2) != 0 {
			t.Fatalf("expected 0 notifications after deleting read")
		}
	}
}
