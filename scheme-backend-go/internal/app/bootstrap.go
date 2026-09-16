package app

import (
	"context"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	"scheme-backend-go/internal/config"
	adminHttp "scheme-backend-go/internal/features/admin/delivery/http"
	adminRepo "scheme-backend-go/internal/features/admin/repository"
	adminSvc "scheme-backend-go/internal/features/admin/service"
	authHttp "scheme-backend-go/internal/features/auth/delivery/http"
	authRepo "scheme-backend-go/internal/features/auth/repository"
	authSvc "scheme-backend-go/internal/features/auth/service"
	chatHttp "scheme-backend-go/internal/features/chat/delivery/http"
	chatRepo "scheme-backend-go/internal/features/chat/repository"
	chatSvc "scheme-backend-go/internal/features/chat/service"
	eligHttp "scheme-backend-go/internal/features/eligibility/delivery/http"
	eligSvc "scheme-backend-go/internal/features/eligibility/service"
	schemesHttp "scheme-backend-go/internal/features/schemes/delivery/http"
	schemesRepo "scheme-backend-go/internal/features/schemes/repository"
	schemesSvc "scheme-backend-go/internal/features/schemes/service"
	vaultHttp "scheme-backend-go/internal/features/vault/delivery/http"
	vaultRepo "scheme-backend-go/internal/features/vault/repository"
	vaultSvc "scheme-backend-go/internal/features/vault/service"
	"scheme-backend-go/internal/infrastructure"
	"scheme-backend-go/internal/pkg/errors"
	"scheme-backend-go/internal/pkg/jwt"
)

func NewApp(
	cfg *config.Config,
	pool *pgxpool.Pool,
	rdb *redis.Client,
	storage infrastructure.StorageService,
) *fiber.App {
	app := fiber.New(fiber.Config{
		ErrorHandler: errors.FiberErrorHandler,
		AppName:      "Sovereign Citizen Welfare Engine (Go)",
		BodyLimit:    20 * 1024 * 1024, // 20 MB for document uploads
	})

	// Middlewares
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${latency} ${method} ${path}\n",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, HEAD, PUT, DELETE, PATCH, OPTIONS",
	}))

	// Shared JWT service
	jwtSvc := jwt.NewService(cfg)

	// Repositories
	authR := authRepo.NewAuthRepository(pool)
	schemesR := schemesRepo.NewSchemesRepository(pool)
	vaultR := vaultRepo.NewVaultRepository(pool)
	chatR := chatRepo.NewChatRepository(pool)
	adminR := adminRepo.NewAdminRepository(pool)

	// Services
	authService := authSvc.NewAuthService(authR, jwtSvc)
	schemesService := schemesSvc.NewSchemesService(schemesR, rdb)
	eligibilityService := eligSvc.NewEligibilityService(schemesR, pool)
	vaultService := vaultSvc.NewVaultService(vaultR, storage)
	chatService := chatSvc.NewChatService(chatR, schemesR, cfg)
	adminService := adminSvc.NewAdminService(adminR)

	// Handlers
	authHandler := authHttp.NewAuthHandler(authService, jwtSvc)
	schemesHandler := schemesHttp.NewSchemesHandler(schemesService)
	eligibilityHandler := eligHttp.NewEligibilityHandler(eligibilityService, jwtSvc)
	vaultHandler := vaultHttp.NewVaultHandler(vaultService, jwtSvc)
	chatHandler := chatHttp.NewChatHandler(chatService, jwtSvc)
	adminHandler := adminHttp.NewAdminHandler(adminService, jwtSvc)

	// Health check endpoint
	healthCheck := func(c *fiber.Ctx) error {
		checks := map[string]string{
			"database": "healthy",
			"storage":  "healthy",
			"cache":    "disabled",
		}

		if err := pool.Ping(c.UserContext()); err != nil {
			checks["database"] = "unhealthy"
		}
		if rdb != nil {
			if err := rdb.Ping(c.UserContext()).Err(); err == nil {
				checks["cache"] = "healthy"
			} else {
				checks["cache"] = "unhealthy"
			}
		}

		return c.Status(http.StatusOK).JSON(fiber.Map{
			"status":  "ok",
			"version": "2.0.0",
			"checks":  checks,
		})
	}

	app.Get("/health", healthCheck)
	app.Get("/health/ready", healthCheck)
	app.Get("/health/live", healthCheck)

	// Register routes on root (FastAPI exact match)
	authHandler.RegisterRoutes(app)
	schemesHandler.RegisterRoutes(app)
	eligibilityHandler.RegisterRoutes(app)
	vaultHandler.RegisterRoutes(app)
	chatHandler.RegisterRoutes(app)
	adminHandler.RegisterRoutes(app)

	// Register routes on /api/v1 (standard REST prefix)
	v1 := app.Group("/api/v1")
	v1.Get("/health", healthCheck)
	authHandler.RegisterRoutes(v1)
	schemesHandler.RegisterRoutes(v1)
	eligibilityHandler.RegisterRoutes(v1)
	vaultHandler.RegisterRoutes(v1)
	chatHandler.RegisterRoutes(v1)
	adminHandler.RegisterRoutes(v1)

	return app
}

func Bootstrap(ctx context.Context) (*fiber.App, *config.Config, func(), error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, nil, nil, err
	}

	pool, err := infrastructure.NewPostgresPool(ctx, cfg)
	if err != nil {
		return nil, nil, nil, err
	}

	rdb, _ := infrastructure.NewRedisClient(ctx, cfg)
	storage, _ := infrastructure.NewCloudinaryStorage(cfg)

	app := NewApp(cfg, pool, rdb, storage)

	cleanup := func() {
		pool.Close()
		if rdb != nil {
			_ = rdb.Close()
		}
	}

	return app, cfg, cleanup, nil
}
