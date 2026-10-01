package database

import (
	"fmt"
	"net/url"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

// Connect opens a PostgreSQL connection pool and verifies connectivity.
func Connect(dsn string) (*sqlx.DB, error) {
	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("database: failed to connect: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)

	return db, nil
}

// RunMigrations applies all pending database migrations from the given path.
// dsn is in key=value format: "host=… port=… dbname=… user=… password=… sslmode=…"
func RunMigrations(dsn, migrationsPath string) error {
	migrateURL, err := dsnToURL(dsn)
	if err != nil {
		return fmt.Errorf("database: build migrate URL: %w", err)
	}

	m, err := migrate.New(
		fmt.Sprintf("file://%s", migrationsPath),
		migrateURL,
	)
	if err != nil {
		return fmt.Errorf("database: failed to create migrator: %w", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("database: migration failed: %w", err)
	}

	return nil
}

// dsnToURL converts a "key=value" DSN to a postgres:// URL for golang-migrate.
func dsnToURL(dsn string) (string, error) {
	params := make(map[string]string)
	for _, part := range strings.Fields(dsn) {
		kv := strings.SplitN(part, "=", 2)
		if len(kv) == 2 {
			params[kv[0]] = kv[1]
		}
	}

	host := params["host"]
	port := params["port"]
	if host == "" {
		host = "localhost"
	}
	if port == "" {
		port = "5432"
	}

	u := &url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(params["user"], params["password"]),
		Host:   host + ":" + port,
		Path:   "/" + params["dbname"],
	}
	q := url.Values{}
	if sslmode, ok := params["sslmode"]; ok {
		q.Set("sslmode", sslmode)
	}
	u.RawQuery = q.Encode()

	return u.String(), nil
}
