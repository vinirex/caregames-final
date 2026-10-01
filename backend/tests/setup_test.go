package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/caregames/api/internal/database"
	"github.com/caregames/api/internal/router"
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

// testDB is the shared database connection for integration tests.
var testDB *sqlx.DB

// TestMain sets up and tears down the test database.
func TestMain(m *testing.M) {
	gin.SetMode(gin.TestMode)

	dsn := testDSN()
	var err error
	testDB, err = database.Connect(dsn)
	if err != nil {
		fmt.Fprintf(os.Stderr, "test setup: db connect failed: %v\n", err)
		os.Exit(1)
	}

	// Run migrations — path relative to the tests/ package directory
	migrationsPath := "../internal/database/migrations"
	if err := database.RunMigrations(dsn, migrationsPath); err != nil {
		fmt.Fprintf(os.Stderr, "test setup: migrations failed: %v\n", err)
		os.Exit(1)
	}

	code := m.Run()

	// Teardown: drop all data between test runs by truncating tables
	_ = truncateAll(testDB)
	testDB.Close()
	os.Exit(code)
}

// newTestServer returns a ready-to-use httptest.Server backed by the test DB.
func newTestServer(t *testing.T) *gin.Engine {
	t.Helper()
	truncateAll(testDB) // fresh state per test
	return router.Setup(testDB)
}

// doRequest performs an HTTP request against the test server and returns the recorder.
func doRequest(t *testing.T, engine *gin.Engine, method, path string, body interface{}, headers map[string]string) *httptest.ResponseRecorder {
	t.Helper()

	var reqBody *bytes.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("doRequest: marshal body: %v", err)
		}
		reqBody = bytes.NewReader(b)
	} else {
		reqBody = bytes.NewReader(nil)
	}

	req, err := http.NewRequest(method, path, reqBody)
	if err != nil {
		t.Fatalf("doRequest: create request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	for k, v := range headers {
		req.Header.Set(k, v)
	}

	w := httptest.NewRecorder()
	engine.ServeHTTP(w, req)
	return w
}

// parseBody unmarshals the response body into v.
func parseBody(t *testing.T, w *httptest.ResponseRecorder, v interface{}) {
	t.Helper()
	if err := json.Unmarshal(w.Body.Bytes(), v); err != nil {
		t.Fatalf("parseBody: %v (body: %s)", err, w.Body.String())
	}
}

// testDSN returns the test database DSN from environment variables or defaults.
func testDSN() string {
	host := envOr("TEST_DB_HOST", "localhost")
	port := envOr("TEST_DB_PORT", "5434")
	name := envOr("TEST_DB_NAME", "caregames_test")
	user := envOr("TEST_DB_USER", "caregames")
	pass := envOr("TEST_DB_PASSWORD", "caregames_secret")
	return fmt.Sprintf("host=%s port=%s dbname=%s user=%s password=%s sslmode=disable", host, port, name, user, pass)
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// truncateAll clears all user-data tables to ensure test isolation.
func truncateAll(db *sqlx.DB) error {
	_, err := db.Exec(`
		TRUNCATE TABLE
			season_rankings, group_members, groups, notifications,
			health_sync_records, user_devices, benefit_redemptions, benefits,
			user_challenge_progress, point_transactions, user_points,
			user_profiles, user_api_keys, users
		CASCADE`)
	
	// Ensure seeded challenges exist (in case they were wiped out or missing)
	db.Exec(`
		INSERT INTO challenges (slug, title, description, icon_name, type, metric, target_value, target_unit, points_reward, is_active, is_fixed)
		VALUES
			('steps_10k',      '10.000 passos por dia',  'Alcance sua meta diária de passos para melhorar a saúde cardiovascular.', 'directions-walk',  'daily', 'steps',         10000, 'steps',   100, TRUE, TRUE),
			('water_2l',       'Beber 2L de Água',        'Mantenha-se hidratado ao longo do dia. Registre seu consumo diário.',     'water-drop',       'daily', 'water_ml',       2000, 'ml',       50, TRUE, TRUE),
			('meditation_15m', '15 min de Meditação',     'Concentre sua mente com uma sessão diária de meditação guiada.',          'self-improvement', 'daily', 'meditation_min',   15, 'minutes',  75, TRUE, TRUE)
		ON CONFLICT (slug) DO NOTHING;
	`)

	// Seed benefits
	db.Exec(`
		INSERT INTO benefits (title, description, points_cost, stock, is_active)
		SELECT 'Voucher R$50 Ifood', 'Voucher de desconto', 50, 100, TRUE
		WHERE NOT EXISTS (SELECT 1 FROM benefits WHERE title = 'Voucher R$50 Ifood');
	`)

	return err
}

// authHeader returns the header map needed for authenticated requests.
func authHeader(apiKey string) map[string]string {
	return map[string]string{"X-API-Key": apiKey}
}
