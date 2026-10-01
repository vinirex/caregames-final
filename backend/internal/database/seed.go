package database

import (
	"log"

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

	// Optionally seed an admin user here if needed, but for security, usually it's better not to seed passwords.
	// For now, these basic objects populate the platform catalog.

	log.Println("✅ Database seeded successfully.")
	return nil
}
