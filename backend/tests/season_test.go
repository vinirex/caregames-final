package tests

import (
	"net/http"
	"testing"
	"time"
)

func TestSeasons_CRUD(t *testing.T) {
	e := newTestServer(t)
	userKey := registerAndLogin(t, e, "season@test.com", "Senha123", 30)

	// Create
	start := time.Now().AddDate(0, 0, 1)
	end := time.Now().AddDate(0, 1, 0)
	
	createPayload := map[string]interface{}{
		"name": "Temporada de Teste",
		"description": "Descricao da temporada de teste",
		"starts_at": start.Format(time.RFC3339),
		"ends_at": end.Format(time.RFC3339),
	}

	wCreate := doRequest(t, e, http.MethodPost, "/api/v1/seasons", createPayload, authHeader(userKey))
	if wCreate.Code != http.StatusCreated {
		t.Fatalf("failed to create season: %s", wCreate.Body.String())
	}

	var resp map[string]interface{}
	parseBody(t, wCreate, &resp)
	
	seasonData := resp["data"].(map[string]interface{})
	seasonID := seasonData["id"].(string)

	if seasonData["name"] != "Temporada de Teste" {
		t.Fatalf("expected name Temporada de Teste, got %v", seasonData["name"])
	}

	// Activate
	wActivate := doRequest(t, e, http.MethodPost, "/api/v1/seasons/"+seasonID+"/activate", nil, authHeader(userKey))
	if wActivate.Code != http.StatusOK {
		t.Fatalf("failed to activate season: %s", wActivate.Body.String())
	}

	// Get Active
	wGetActive := doRequest(t, e, http.MethodGet, "/api/v1/seasons/active", nil, authHeader(userKey))
	if wGetActive.Code != http.StatusOK {
		t.Fatalf("failed to get active season: %s", wGetActive.Body.String())
	}
	
	var activeResp map[string]interface{}
	parseBody(t, wGetActive, &activeResp)
	activeData := activeResp["data"].(map[string]interface{})
	
	if activeData["id"] != seasonID {
		t.Fatalf("expected active season to be %s, got %v", seasonID, activeData["id"])
	}

	// Update
	updatePayload := map[string]interface{}{
		"name": "Temporada Atualizada",
		"description": "Atualizada",
		"starts_at": start.Format(time.RFC3339),
		"ends_at": end.Format(time.RFC3339),
	}
	wUpdate := doRequest(t, e, http.MethodPut, "/api/v1/seasons/"+seasonID, updatePayload, authHeader(userKey))
	if wUpdate.Code != http.StatusOK {
		t.Fatalf("failed to update season: %s", wUpdate.Body.String())
	}

	// List
	wList := doRequest(t, e, http.MethodGet, "/api/v1/seasons", nil, authHeader(userKey))
	if wList.Code != http.StatusOK {
		t.Fatalf("failed to list seasons: %s", wList.Body.String())
	}
	
	var listResp map[string]interface{}
	parseBody(t, wList, &listResp)
	
	listData := listResp["data"].([]interface{})
	if len(listData) == 0 {
		t.Fatalf("expected at least one season in list")
	}

	// Delete
	wDelete := doRequest(t, e, http.MethodDelete, "/api/v1/seasons/"+seasonID, nil, authHeader(userKey))
	if wDelete.Code != http.StatusOK {
		t.Fatalf("failed to delete season: %s", wDelete.Body.String())
	}

	// Try getting it again
	wGetDeleted := doRequest(t, e, http.MethodGet, "/api/v1/seasons/"+seasonID, nil, authHeader(userKey))
	if wGetDeleted.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for deleted season, got %d", wGetDeleted.Code)
	}
}
