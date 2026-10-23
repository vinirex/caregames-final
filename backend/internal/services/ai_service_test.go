package services

import (
	"strings"
	"testing"
	"time"

	"github.com/caregames/api/internal/models"
)

func TestAIService_PlaceholderKeyDetection(t *testing.T) {
	tests := []struct {
		key      string
		expected bool
	}{
		{"", true},
		{"YOUR_GEMINI_API_KEY_HERE", true},
		{"your-ai-api-key-here", true},
		{"PLACEHOLDER_KEY", true},
		{"INSERT_KEY_HERE", true},
		{"AIzaSyB1234567890abcdef", false},
		{"sk-proj-1234567890abcdef", false},
	}

	for _, tt := range tests {
		ai := NewAIService(tt.key, "gemini-1.5-flash")
		if ai.isPlaceholderKey() != tt.expected {
			t.Errorf("isPlaceholderKey(%q) = %v, expected %v", tt.key, ai.isPlaceholderKey(), tt.expected)
		}
	}
}

func TestAIService_BuildPrompt(t *testing.T) {
	prompt := BuildPrompt("Temporada de Outono", "01/03/2026", "31/05/2026", "", `[{"slug":"passos_10k","title":"10k Passos","metric":"steps"}]`)

	if !strings.Contains(prompt, "Nome: Temporada de Outono") {
		t.Errorf("expected prompt to contain season name")
	}
	if !strings.Contains(prompt, "Início: 01/03/2026") {
		t.Errorf("expected prompt to contain starts_at")
	}
	if !strings.Contains(prompt, "Fim: 31/05/2026") {
		t.Errorf("expected prompt to contain ends_at")
	}
	if !strings.Contains(prompt, "passos_10k") {
		t.Errorf("expected prompt to contain previous challenges")
	}
	if !strings.Contains(prompt, "Caminhada ou passos diários") {
		t.Errorf("expected prompt to contain activities catalog")
	}
}

func TestAIService_GenerateSeasonalChallengesFallback(t *testing.T) {
	ai := NewAIService("YOUR_GEMINI_API_KEY_HERE", "gemini-1.5-flash")

	seasonDesc := "Temporada com foco em superação e saúde preventiva"
	season := &models.Season{
		ID:          "s1000000-0000-0000-0000-000000000001",
		Name:        "Temporada de Primavera 2026",
		Description: &seasonDesc,
		StartsAt:    time.Now(),
		EndsAt:      time.Now().Add(90 * 24 * time.Hour),
		IsActive:    true,
	}

	challenges, err := ai.GenerateSeasonalChallenges(season, "[]")
	if err != nil {
		t.Fatalf("GenerateSeasonalChallenges failed: %v", err)
	}

	if len(challenges) != 5 {
		t.Fatalf("expected exactly 5 challenges, got %d", len(challenges))
	}

	validMetrics := map[string]bool{
		"steps":          true,
		"water_ml":       true,
		"meditation_min": true,
		"custom":         true,
	}

	seenSlugs := make(map[string]bool)

	for i, c := range challenges {
		if c.Title == "" {
			t.Errorf("challenge[%d] title is empty", i)
		}
		if c.Description == "" {
			t.Errorf("challenge[%d] description is empty", i)
		}
		if c.Type != "seasonal" {
			t.Errorf("challenge[%d] expected type 'seasonal', got %q", i, c.Type)
		}
		if !validMetrics[c.Metric] {
			t.Errorf("challenge[%d] invalid metric: %q", i, c.Metric)
		}
		if c.TargetValue <= 0 {
			t.Errorf("challenge[%d] invalid target_value: %f", i, c.TargetValue)
		}
		if c.TargetUnit == "" {
			t.Errorf("challenge[%d] target_unit is empty", i)
		}
		if c.PointsReward <= 0 {
			t.Errorf("challenge[%d] points_reward <= 0", i)
		}
		if !c.IsActive {
			t.Errorf("challenge[%d] is_active should be true", i)
		}
		if c.IsFixed {
			t.Errorf("challenge[%d] is_fixed should be false for seasonal challenges", i)
		}
		if !c.SeasonID.Valid || c.SeasonID.String != season.ID {
			t.Errorf("challenge[%d] expected SeasonID %s, got %v", i, season.ID, c.SeasonID)
		}
		if seenSlugs[c.Slug] {
			t.Errorf("duplicate slug found: %q", c.Slug)
		}
		seenSlugs[c.Slug] = true
	}
}

func TestAIService_ParseAndValidateChallengesWithWrapper(t *testing.T) {
	ai := NewAIService("fake-key", "gemini-1.5-flash")

	season := &models.Season{
		ID:       "s2000000-0000-0000-0000-000000000002",
		Name:     "Temporada de Verão",
		StartsAt: time.Now(),
		EndsAt:   time.Now().Add(60 * 24 * time.Hour),
		IsActive: true,
	}

	rawJSON := `{
  "challenges": [
    {
      "slug": "caminhada-solar",
      "title": "Caminhada Solar da Estação",
      "description": "Acumule 100.000 passos durante os dias ensolarados da temporada.",
      "icon_name": "directions-walk",
      "type": "seasonal",
      "metric": "steps",
      "target_value": 100000,
      "target_unit": "passos"
    },
    {
      "slug": "agua-fresca",
      "title": "Hidratação Refrescante",
      "description": "Beba 50.000 ml de água ao longo da temporada mantendo o organismo bem hidratado.",
      "icon_name": "water-drop",
      "type": "seasonal",
      "metric": "water_ml",
      "target_value": 50000,
      "target_unit": "ml"
    },
    {
      "slug": "zen-verao",
      "title": "Respiração Consciente",
      "description": "Complete 200 minutos de pausa reflexiva e respiração guiada.",
      "icon_name": "self-improvement",
      "type": "seasonal",
      "metric": "meditation_min",
      "target_value": 200,
      "target_unit": "minutos"
    },
    {
      "slug": "alongamento-matinal",
      "title": "Alongamento Matinal Suave",
      "description": "Pratique 120 minutos de alongamentos leves para começar o dia bem.",
      "icon_name": "fitness-center",
      "type": "seasonal",
      "metric": "custom",
      "target_value": 120,
      "target_unit": "minutos"
    },
    {
      "slug": "dias-saudaveis",
      "title": "Compromisso com o Bem-Estar",
      "description": "Registre hábitos saudáveis em pelo menos 20 dias da temporada.",
      "icon_name": "emoji-events",
      "type": "seasonal",
      "metric": "custom",
      "target_value": 20,
      "target_unit": "dias"
    }
  ]
}`

	challenges, err := ai.parseAndValidateChallenges(rawJSON, season)
	if err != nil {
		t.Fatalf("parseAndValidateChallenges failed: %v", err)
	}

	if len(challenges) != 5 {
		t.Fatalf("expected 5 challenges, got %d", len(challenges))
	}

	if challenges[0].Metric != "steps" {
		t.Errorf("expected first challenge to be 'steps', got %s", challenges[0].Metric)
	}
	if challenges[0].PointsReward <= 0 {
		t.Errorf("expected points_reward to be assigned by backend, got %d", challenges[0].PointsReward)
	}
	if challenges[0].Type != "seasonal" {
		t.Errorf("expected type 'seasonal', got %s", challenges[0].Type)
	}
	if challenges[0].IconName.String != "directions-walk" {
		t.Errorf("expected directions-walk icon, got %s", challenges[0].IconName.String)
	}
}
