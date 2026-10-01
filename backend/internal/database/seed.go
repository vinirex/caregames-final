package database

import (
	"log"

	"github.com/caregames/api/pkg/crypto"
	"github.com/jmoiron/sqlx"
)

// Seed populates the database with initial data if it doesn't already exist.
func Seed(db *sqlx.DB) error {
	log.Println("🌱 Seeding database...")

	// Seed Fixed Challenges
	challengesQuery := `
		INSERT INTO challenges (id, slug, title, description, points_reward, goal_type, goal_value, is_fixed, type)
		VALUES 
		('a1000000-0000-0000-0000-000000000001', 'steps_10k', '10.000 Passos', 'Caminhe 10.000 passos hoje.', 100, 'steps', 10000, true, 'daily'),
		('a2000000-0000-0000-0000-000000000002', 'water_2l', 'Hidratação Total', 'Beba 2 litros de água.', 50, 'water', 2000, true, 'daily'),
		('a3000000-0000-0000-0000-000000000003', 'meditation_15m', 'Zen Master', 'Medite por 15 minutos.', 75, 'meditation', 15, true, 'daily')
		ON CONFLICT (slug) DO NOTHING;
	`
	if _, err := db.Exec(challengesQuery); err != nil {
		return err
	}

	// Seed Benefits
	benefitsQuery := `
		INSERT INTO benefits (id, title, description, points_cost, category, stock, is_active, icon_name)
		VALUES 
		('b1000000-0000-0000-0000-000000000001', 'Desconto SmartFit 20%', 'Voucher de 20% de desconto na mensalidade.', 500, 'gym', 100, true, 'fitness-center'),
		('b2000000-0000-0000-0000-000000000002', 'Voucher Spa Relaxante', '1 sessão de massagem.', 1500, 'spa', 50, true, 'spa'),
		('b3000000-0000-0000-0000-000000000003', 'Consulta Nutricional Online', '1 hora com nutricionista parceiro.', 2000, 'health', 20, true, 'local-hospital')
		ON CONFLICT DO NOTHING;
	`
	if _, err := db.Exec(benefitsQuery); err != nil {
		return err
	}

	// Password for mocks
	hash, err := crypto.HashPassword("SenhaSegura123!")
	if err != nil {
		return err
	}

	// Seed Users (Admin + Normal Users)
	usersQuery := `
		INSERT INTO users (id, email, password_hash, role)
		VALUES 
		('u1000000-0000-0000-0000-000000000001', 'admin@caregames.com', $1, 'admin'),
		('u2000000-0000-0000-0000-000000000002', 'joao.silva@teste.com', $1, 'user'),
		('u3000000-0000-0000-0000-000000000003', 'maria.souza@teste.com', $1, 'user')
		ON CONFLICT (email) DO NOTHING;
	`
	if _, err := db.Exec(usersQuery, hash); err != nil {
		return err
	}

	// Seed User Profiles
	profilesQuery := `
		INSERT INTO user_profiles (user_id, name, theme_preference)
		VALUES 
		('u1000000-0000-0000-0000-000000000001', 'Admin CareGames', 'system'),
		('u2000000-0000-0000-0000-000000000002', 'João Silva', 'light'),
		('u3000000-0000-0000-0000-000000000003', 'Maria Souza', 'dark')
		ON CONFLICT (user_id) DO NOTHING;
	`
	if _, err := db.Exec(profilesQuery); err != nil {
		return err
	}

	// Seed User Points
	pointsQuery := `
		INSERT INTO user_points (user_id, balance, lifetime_earned)
		VALUES 
		('u1000000-0000-0000-0000-000000000001', 9999, 9999),
		('u2000000-0000-0000-0000-000000000002', 1500, 1500),
		('u3000000-0000-0000-0000-000000000003', 300, 300)
		ON CONFLICT (user_id) DO NOTHING;
	`
	if _, err := db.Exec(pointsQuery); err != nil {
		return err
	}

	// Seed Groups
	groupsQuery := `
		INSERT INTO groups (id, name, description, owner_id, invite_code, is_public, max_members)
		VALUES 
		('g1000000-0000-0000-0000-000000000001', 'Esquadrão Saúde FIAP', 'Grupo dos alunos super saudáveis', 'u2000000-0000-0000-0000-000000000002', 'FIAPSAUDE', true, 50)
		ON CONFLICT (invite_code) DO NOTHING;
	`
	if _, err := db.Exec(groupsQuery); err != nil {
		return err
	}

	// Seed Group Members
	groupMembersQuery := `
		INSERT INTO group_members (group_id, user_id, role)
		VALUES 
		('g1000000-0000-0000-0000-000000000001', 'u2000000-0000-0000-0000-000000000002', 'owner'),
		('g1000000-0000-0000-0000-000000000001', 'u3000000-0000-0000-0000-000000000003', 'member')
		ON CONFLICT (group_id, user_id) DO NOTHING;
	`
	if _, err := db.Exec(groupMembersQuery); err != nil {
		return err
	}

	// Seed Season
	seasonsQuery := `
		INSERT INTO seasons (id, title, description, start_date, end_date, is_active)
		VALUES 
		('s1000000-0000-0000-0000-000000000001', 'Temporada de Verão 2026', 'A primeira temporada do CareGames+', NOW(), NOW() + INTERVAL '90 days', true)
		ON CONFLICT DO NOTHING;
	`
	if _, err := db.Exec(seasonsQuery); err != nil {
		return err
	}

	// Seed Season Rankings (opt-in for users)
	seasonRankingsQuery := `
		INSERT INTO season_rankings (season_id, user_id, opt_in)
		VALUES 
		('s1000000-0000-0000-0000-000000000001', 'u2000000-0000-0000-0000-000000000002', true),
		('s1000000-0000-0000-0000-000000000001', 'u3000000-0000-0000-0000-000000000003', true)
		ON CONFLICT (season_id, user_id) DO NOTHING;
	`
	if _, err := db.Exec(seasonRankingsQuery); err != nil {
		return err
	}

	log.Println("✅ Database seeded successfully with full mocks.")
	return nil
}
