package database

import (
	"log"

	"github.com/caregames/api/pkg/crypto"
	"github.com/jmoiron/sqlx"
)

// Seed populates the database with initial data if it doesn't already exist.
func Seed(db *sqlx.DB) error {
	log.Println("🌱 Seeding database...")

	// 1. Generate password for mock users
	hash, err := crypto.HashPassword("SenhaSegura123!")
	if err != nil {
		return err
	}

	// 2. Seed Users (Needs to be first due to Foreign Keys)
	usersQuery := `
		INSERT INTO users (id, email, password_hash, role, age)
		VALUES 
		('f1000000-0000-0000-0000-000000000001', 'admin@caregames.com', $1, 'admin', 30),
		('f2000000-0000-0000-0000-000000000002', 'joao.silva@teste.com', $1, 'user', 25),
		('f3000000-0000-0000-0000-000000000003', 'maria.souza@teste.com', $1, 'user', 28)
		ON CONFLICT (email) DO NOTHING;
	`
	if _, err := db.Exec(usersQuery, hash); err != nil {
		return err
	}

	// 3. Seed User Profiles (fixed theme_pref column and values)
	profilesQuery := `
		INSERT INTO user_profiles (user_id, name, theme_pref)
		VALUES 
		('f1000000-0000-0000-0000-000000000001', 'Admin CareGames', 'dark'),
		('f2000000-0000-0000-0000-000000000002', 'João Silva', 'light'),
		('f3000000-0000-0000-0000-000000000003', 'Maria Souza', 'dark')
		ON CONFLICT (user_id) DO NOTHING;
	`
	if _, err := db.Exec(profilesQuery); err != nil {
		return err
	}

	// 4. Seed User Points (fixed lifetime_earned -> total_earned and added total_spent)
	pointsQuery := `
		INSERT INTO user_points (user_id, balance, total_earned, total_spent)
		VALUES 
		('f1000000-0000-0000-0000-000000000001', 9999, 9999, 0),
		('f2000000-0000-0000-0000-000000000002', 1500, 1500, 0),
		('f3000000-0000-0000-0000-000000000003', 300, 300, 0)
		ON CONFLICT (user_id) DO NOTHING;
	`
	if _, err := db.Exec(pointsQuery); err != nil {
		return err
	}

	// 5. Seed Seasons (fixed title/start_date -> name/starts_at)
	seasonsQuery := `
		INSERT INTO seasons (id, name, description, starts_at, ends_at, is_active)
		VALUES 
		('e1000000-0000-0000-0000-000000000001', 'Temporada de Verão 2026', 'A primeira temporada do CareGames+', NOW(), NOW() + INTERVAL '90 days', true)
		ON CONFLICT (id) DO NOTHING;
	`
	if _, err := db.Exec(seasonsQuery); err != nil {
		return err
	}

	// 6. Seed Challenges (added icon_name to match schema constraints)
	challengesQuery := `
		INSERT INTO challenges (id, slug, title, description, icon_name, points_reward, metric, target_value, target_unit, is_fixed, type)
		VALUES 
		('a1000000-0000-0000-0000-000000000001', 'steps_10k', '10.000 Passos', 'Caminhe 10.000 passos hoje.', 'directions-walk', 100, 'steps', 10000, 'steps', true, 'daily'),
		('a2000000-0000-0000-0000-000000000002', 'water_2l', 'Hidratação Total', 'Beba 2 litros de água.', 'water-drop', 50, 'water_ml', 2000, 'ml', true, 'daily'),
		('a3000000-0000-0000-0000-000000000003', 'meditation_15m', 'Zen Master', 'Medite por 15 minutos.', 'self-improvement', 75, 'meditation_min', 15, 'minutes', true, 'daily')
		ON CONFLICT (slug) DO NOTHING;
	`
	if _, err := db.Exec(challengesQuery); err != nil {
		return err
	}

	// 7. MOCK EXTRA: User Challenge Progress
	progressQuery := `
		INSERT INTO user_challenge_progress (user_id, challenge_id, status, current_value, points_awarded)
		VALUES
		('f2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'in_progress', 5000, 0),
		('f2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'completed', 2000, 50)
		ON CONFLICT (user_id, challenge_id) DO NOTHING;
	`
	if _, err := db.Exec(progressQuery); err != nil {
		return err
	}

	// 8. Seed Benefits (fixed ON CONFLICT to target ID explicitly)
	benefitsQuery := `
		INSERT INTO benefits (id, title, description, points_cost, category, stock, is_active, image_url)
		VALUES 
		('b1000000-0000-0000-0000-000000000001', 'Desconto SmartFit 20%', 'Voucher de 20% de desconto na mensalidade.', 500, 'gym', 100, true, 'fitness-center'),
		('b2000000-0000-0000-0000-000000000002', 'Voucher Spa Relaxante', '1 sessão de massagem.', 1500, 'spa', 50, true, 'spa'),
		('b3000000-0000-0000-0000-000000000003', 'Consulta Nutricional Online', '1 hora com nutricionista parceiro.', 2000, 'health', 20, true, 'local-hospital')
		ON CONFLICT (id) DO NOTHING;
	`
	if _, err := db.Exec(benefitsQuery); err != nil {
		return err
	}

	// 9. Seed Groups
	groupsQuery := `
		INSERT INTO groups (id, name, description, owner_id, invite_code, is_public, max_members)
		VALUES 
		('c1000000-0000-0000-0000-000000000001', 'Esquadrão Saúde FIAP', 'Grupo dos alunos super saudáveis', 'f2000000-0000-0000-0000-000000000002', 'FIAPSAUDE', true, 50)
		ON CONFLICT (invite_code) DO NOTHING;
	`
	if _, err := db.Exec(groupsQuery); err != nil {
		return err
	}

	// 10. Seed Group Members
	groupMembersQuery := `
		INSERT INTO group_members (group_id, user_id, role)
		VALUES 
		('c1000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-000000000002', 'owner'),
		('c1000000-0000-0000-0000-000000000001', 'f3000000-0000-0000-0000-000000000003', 'member')
		ON CONFLICT (group_id, user_id) DO NOTHING;
	`
	if _, err := db.Exec(groupMembersQuery); err != nil {
		return err
	}

	// 11. Seed Season Rankings (opt-in for users)
	seasonRankingsQuery := `
		INSERT INTO season_rankings (season_id, user_id, points_snapshot, opt_in)
		VALUES 
		('e1000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-000000000002', 1500, true),
		('e1000000-0000-0000-0000-000000000001', 'f3000000-0000-0000-0000-000000000003', 300, true)
		ON CONFLICT (season_id, user_id) DO NOTHING;
	`
	if _, err := db.Exec(seasonRankingsQuery); err != nil {
		return err
	}

	log.Println("✅ Database seeded successfully with full mocks.")
	return nil
}
