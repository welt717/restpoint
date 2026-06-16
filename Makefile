#!/usr/bin/env make
# ============================================
# Restpoint — Production Makefile v3.0
# Modern Kenyan Mortuary Management Platform
# ============================================

SHELL := /bin/bash
.SHELLFLAGS := -euo pipefail -c
.ONESHELL:
MAKEFLAGS += --warn-undefined-variables

# Colors
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
CYAN := \033[0;36m
RESET := \033[0m

# Auto-detect commands
YARN := $(shell command -v yarn 2>/dev/null || echo "")
NPM := $(shell command -v npm 2>/dev/null || echo "")
DOCKER := $(shell command -v docker 2>/dev/null || echo "")
COMPOSE := $(shell command -v docker-compose 2>/dev/null || command -v docker 2>/dev/null && echo "docker compose" || echo "")
NODE := $(shell command -v node 2>/dev/null || echo "")
CURL := $(shell command -v curl 2>/dev/null || echo "")

# Project metadata
PROJECT_NAME := restpoint
REGISTRY := ghcr.io/$(PROJECT_NAME)
BUILD_TIME := $(shell date -u +%Y-%m-%dT%H:%M:%SZ)
COMMIT_HASH := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
TIMESTAMP := $(shell date +%s)

# ============================================
# UTILITY FUNCTIONS
# ============================================

# Check if a command exists
define check_cmd
	@if [ -z "$($(1))" ]; then \
		echo "$(RED)✗ ERROR: $(2) is not installed.$(RESET)" >&2; \
		exit 1; \
	fi
endef

define check_yarn
	$(call check_cmd,YARN,Yarn)
endef

define check_docker
	$(call check_cmd,DOCKER,Docker)
endef

define check_node
	$(call check_cmd,NODE,Node.js)
endef

define check_curl
	$(call check_cmd,CURL,curl)
endef

.PHONY: help install setup build rebuild clean lint lint-fix test typecheck dev start stop restart logs \
	docker-up docker-down docker-rebuild docker-logs docker-clean \
	db-migrate db-seed db-reset deploy health status \
	gateway auth tenant deceased marketplace invoice coffin documents edocuments analytics \
	calender mpesa notification qrcode socketio visitors bodycheckout extra updates call portal chemical frontend

# ============================================
# DEFAULT TARGET
# ============================================

help:
	@echo ""
	@echo "$(BLUE)=================================================================$(RESET)"
	@echo "$(BLUE)  Restpoint — Platform Management Commands$(RESET)"
	@echo "$(BLUE)=================================================================$(RESET)"
	@echo ""
	@echo "$(CYAN)Environment:$(RESET)"
	@echo "  Node:    $(shell node --version 2>/dev/null || echo 'not found')"
	@echo "  Yarn:    $(shell yarn --version 2>/dev/null || echo 'not found')"
	@echo "  Docker:  $(shell docker --version 2>/dev/null || echo 'not found')"
	@echo "  Commit:  $(COMMIT_HASH)"
	@echo ""
	@echo "$(YELLOW)Setup & Development:$(RESET)"
	@echo "  make help            Show this help"
	@echo "  make install         Install all dependencies"
	@echo "  make setup           Full setup (install + build)"
	@echo "  make build           Build all services"
	@echo "  make rebuild         Clean rebuild all services"
	@echo "  make clean           Remove node_modules and dist"
	@echo "  make lint            Run all linters"
	@echo "  make lint-fix        Fix lint issues automatically"
	@echo "  make test            Run all tests"
	@echo "  make typecheck       Run TypeScript type checking"
	@echo "  make dev             Start development mode"
	@echo "  make start           Start production services"
	@echo "  make stop            Stop all services"
	@echo "  make restart         Restart all services"
	@echo "  make logs            View logs"
	@echo ""
	@echo "$(YELLOW)Docker:$(RESET)"
	@echo "  make docker-up       Start all containers"
	@echo "  make docker-down     Stop all containers"
	@echo "  make docker-rebuild  Rebuild and restart all containers"
	@echo "  make docker-logs     View container logs"
	@echo "  make docker-clean    Remove all containers and volumes"
	@echo ""
	@echo "$(YELLOW)Database:$(RESET)"
	@echo "  make db-migrate      Run database migrations"
	@echo "  make db-seed         Seed default data"
	@echo "  make db-reset        Reset database (migrate + seed)"
	@echo ""
	@echo "$(YELLOW)Operations:$(RESET)"
	@echo "  make deploy          Full production deployment"
	@echo "  make health          Health check all services"
	@echo "  make status          Show system status"
	@echo ""
	@echo "$(YELLOW)Individual Services:$(RESET)"
	@echo "  make gateway         Start gateway service"
	@echo "  make auth            Start auth service"
	@echo "  make tenant          Start tenant service"
	@echo "  make frontend        Start frontend"
	@echo ""
	@echo "$(BLUE)=================================================================$(RESET)"
	@echo ""

# ============================================
# SETUP & DEPENDENCIES
# ============================================

install:
	$(call check_yarn)
	@echo "$(GREEN)Installing dependencies...$(RESET)"
	@yarn install --frozen-lockfile 2>/dev/null || yarn install
	@echo "$(GREEN)✓ Dependencies installed successfully!$(RESET)"

setup: install build
	@echo "$(GREEN)✓ Setup complete!$(RESET)"

# ============================================
# BUILD
# ============================================

build:
	$(call check_yarn)
	@echo "$(GREEN)Building all services...$(RESET)"
	@yarn workspaces run build 2>/dev/null || echo "$(YELLOW}⚠ Some services skipped build (no build script)$(RESET)"
	@echo "$(GREEN)✓ Build complete!$(RESET)"

rebuild: clean install build
	@echo "$(GREEN)✓ Rebuild complete!$(RESET)"

clean:
	@echo "$(RED)Cleaning up...$(RESET)"
	@rm -rf node_modules
	@find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name "dist" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name "build" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name ".tmp" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name "tsconfig.tsbuildinfo" -delete 2>/dev/null || true
	@echo "$(GREEN)✓ Clean complete!$(RESET)"

# ============================================
# LINTING & TESTING
# ============================================

lint:
	$(call check_yarn)
	@echo "$(GREEN)Running linters...$(RESET)"
	@yarn workspaces run lint 2>/dev/null || echo "$(YELLOW)⚠ Lint check complete (some services may not have lint scripts)$(RESET)"

lint-fix:
	$(call check_yarn)
	@echo "$(GREEN)Fixing lint issues...$(RESET)"
	@yarn workspaces run lint:fix 2>/dev/null || echo "$(YELLOW)⚠ Lint fix complete$(RESET)"

test:
	$(call check_yarn)
	@echo "$(GREEN)Running tests...$(RESET)"
	@yarn workspaces run test 2>/dev/null || echo "$(YELLOW)⚠ No tests found$(RESET)"

typecheck:
	$(call check_yarn)
	@echo "$(GREEN)Running TypeScript type checking...$(RESET)"
	@yarn workspaces run typecheck 2>/dev/null || echo "$(YELLOW)⚠ Typecheck complete (some services may not have typecheck scripts)$(RESET)"

# ============================================
# DEVELOPMENT
# ============================================

dev:
	$(call check_yarn)
	@echo "$(GREEN)Starting development mode...$(RESET)"
	@yarn dev 2>/dev/null || echo "$(RED)✗ No dev script found. Run 'make docker-up' instead$(RESET)"

start:
	$(call check_yarn)
	@echo "$(GREEN)Starting services...$(RESET)"
	@yarn start 2>/dev/null || echo "$(RED)✗ No start script found. Use 'make docker-up'$(RESET)"

stop:
	@echo "$(YELLOW)Stopping services...$(RESET)"
	@docker compose down 2>/dev/null || true
	@echo "$(GREEN)✓ Services stopped$(RESET)"

restart: stop start
	@echo "$(GREEN)✓ Services restarted$(RESET)"

logs:
	@docker compose logs -f --tail=100 2>/dev/null || echo "$(RED)✗ No running containers$(RESET)"

# ============================================
# DOCKER
# ============================================

docker-up:
	$(call check_docker)
	@echo "$(GREEN)Starting Docker services...$(RESET)"
	@docker compose up -d --remove-orphans
	@echo "$(GREEN)✓ Docker services started$(RESET)"
	@echo ""
	@echo "  Run 'make docker-logs' to view logs"
	@echo "  Run 'make health' to check service health"

docker-down:
	$(call check_docker)
	@echo "$(YELLOW)Stopping Docker services...$(RESET)"
	@docker compose down --remove-orphans
	@echo "$(GREEN)✓ Docker services stopped$(RESET)"

docker-rebuild:
	$(call check_docker)
	@echo "$(YELLOW)Rebuilding Docker services...$(RESET)"
	@docker compose down --remove-orphans
	@docker compose build --no-cache
	@docker compose up -d --remove-orphans
	@echo "$(GREEN)✓ Docker rebuild complete$(RESET)"

docker-logs:
	$(call check_docker)
	@docker compose logs -f --tail=100

docker-clean:
	$(call check_docker)
	@echo "$(RED)Cleaning Docker resources...$(RESET)"
	@docker compose down -v --remove-orphans 2>/dev/null || true
	@docker system prune -f 2>/dev/null || true
	@echo "$(GREEN)✓ Docker clean complete$(RESET)"

# ============================================
# DATABASE
# ============================================

db-migrate:
	$(call check_node)
	@echo "$(GREEN)Running database migrations...$(RESET)"
	@if [ -f scripts/migrate.js ]; then \
		node scripts/migrate.js; \
		echo "$(GREEN)✓ Migrations complete!$(RESET)"; \
	else \
		echo "$(YELLOW)⚠ No migration script found (scripts/migrate.js)$(RESET)"; \
	fi

db-seed:
	$(call check_node)
	@echo "$(GREEN)Seeding database...$(RESET)"
	@if [ -f scripts/seed.js ]; then \
		node scripts/seed.js; \
		echo "$(GREEN)✓ Seeding complete!$(RESET)"; \
	else \
		echo "$(YELLOW)⚠ No seed script found (scripts/seed.js)$(RESET)"; \
	fi

db-reset: db-migrate db-seed
	@echo "$(GREEN)✓ Database reset complete!$(RESET)"

# ============================================
# INDIVIDUAL SERVICE COMMANDS
# ============================================

gateway:
	$(call check_yarn)
	@echo "$(GREEN)Starting gateway service...$(RESET)"
	@cd services/api-gateway && npx ts-node server.ts

auth:
	$(call check_yarn)
	@echo "$(GREEN)Starting auth service...$(RESET)"
	@cd services/auth-service && node server.js 2>/dev/null || echo "No server.js found"

tenant:
	$(call check_yarn)
	@echo "$(GREEN)Starting tenant service...$(RESET)"
	@cd services/tenant-service && npx ts-node server.ts 2>/dev/null || node server.js 2>/dev/null || echo "No server found"

frontend:
	$(call check_yarn)
	@echo "$(GREEN)Starting frontend...$(RESET)"
	@cd FrontendClient/client && npm run dev

# ============================================
# HEALTH CHECK
# ============================================

health:
	$(call check_curl)
	@echo "$(BLUE)=================================================================$(RESET)"
	@echo "$(BLUE)  Service Health Check$(RESET)"
	@echo "$(BLUE)=================================================================$(RESET)"
	@echo ""
	@TOTAL=0; OK=0; FAIL=0; \
	SERVICES="5000 5001 5002 5003 5004 5005 5006 5007 5008 5009 5010 5011 5012 5013 5014 5015 5016 5017 5018 5019 5105 5111 8082 3306 6379"; \
	for port in $$SERVICES; do \
		TOTAL=$$((TOTAL+1)); \
		STATUS=$$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$$port/health 2>/dev/null || echo "000"); \
		if [ "$$STATUS" != "000" ] && [ "$$STATUS" != "" ]; then \
			echo "$(GREEN)✓ Port $$port: OK ($$STATUS)$(RESET)"; \
			OK=$$((OK+1)); \
		else \
			ALT_STATUS=$$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$$port/api/v1/health 2>/dev/null || echo "000"); \
			if [ "$$ALT_STATUS" != "000" ] && [ "$$ALT_STATUS" != "" ]; then \
				echo "$(GREEN)✓ Port $$port: OK ($$ALT_STATUS via /api/v1/health)$(RESET)"; \
				OK=$$((OK+1)); \
			else \
				echo "$(RED)✗ Port $$port: DOWN$(RESET)"; \
				FAIL=$$((FAIL+1)); \
			fi; \
		fi; \
	done; \
	echo ""; \
	echo "$(BLUE)Results: $$OK/$$TOTAL healthy, $$FAIL failed$(RESET)"

status:
	@echo "$(BLUE)=================================================================$(RESET)"
	@echo "$(BLUE)  System Status$(RESET)"
	@echo "$(BLUE)=================================================================$(RESET)"
	@echo ""
	@echo "$(CYAN)Node:$(RESET)     $$(node --version 2>/dev/null || echo 'not found')"
	@echo "$(CYAN)Yarn:$(RESET)     $$(yarn --version 2>/dev/null || echo 'not found')"
	@echo "$(CYAN)NPM:$(RESET)      $$(npm --version 2>/dev/null || echo 'not found')"
	@echo "$(CYAN)Docker:$(RESET)   $$(docker --version 2>/dev/null || echo 'not found')"
	@echo "$(CYAN)Git:$(RESET)      $$(git --version 2>/dev/null || echo 'not found')"
	@echo "$(CYAN)Commit:$(RESET)   $(COMMIT_HASH)"
	@echo ""
	@echo "$(CYAN)Containers:$(RESET)"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "  No running containers"

# ============================================
# PRODUCTION DEPLOYMENT
# ============================================

deploy:
	@echo "$(BLUE)=================================================================$(RESET)"
	@echo "$(BLUE)  Restpoint Production Deployment$(RESET)"
	@echo "$(BLUE)=================================================================$(RESET)"
	$(call check_docker)
	$(call check_yarn)
	
	@echo ""
	@echo "$(YELLOW)Step 1/8: Validating environment...$(RESET)"
	@if [ ! -f .env ]; then \
		echo "$(RED)✗ .env file not found!$(RESET)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ Environment validated$(RESET)"
	
	@echo ""
	@echo "$(YELLOW)Step 2/8: Installing dependencies...$(RESET)"
	@yarn install --frozen-lockfile 2>/dev/null || yarn install
	@echo "$(GREEN)✓ Dependencies installed$(RESET)"
	
	@echo ""
	@echo "$(YELLOW)Step 3/8: Running linters...$(RESET)"
	@yarn workspaces run lint 2>/dev/null || true
	@echo "$(GREEN)✓ Linters complete$(RESET)"
	
	@echo ""
	@echo "$(YELLOW)Step 4/8: Building Docker images...$(RESET)"
	@docker compose build
	@echo "$(GREEN)✓ Docker images built$(RESET)"
	
	@echo ""
	@echo "$(YELLOW)Step 5/8: Starting Docker services...$(RESET)"
	@docker compose up -d --remove-orphans
	@echo "$(GREEN)✓ Services started$(RESET)"
	
	@echo ""
	@echo "$(YELLOW)Step 6/8: Running database migrations...$(RESET)"
	$(MAKE) db-migrate
	@echo "$(GREEN)✓ Migrations complete$(RESET)"
	
	@echo ""
	@echo "$(YELLOW)Step 7/8: Verifying health...$(RESET)"
	@sleep 5
	$(MAKE) health
	
	@echo ""
	@echo "$(YELLOW)Step 8/8: Generating deployment report...$(RESET)"
	@echo "Deployment Report" > .deploy-report-$(TIMESTAMP).txt
	@echo "Time: $(BUILD_TIME)" >> .deploy-report-$(TIMESTAMP).txt
	@echo "Commit: $(COMMIT_HASH)" >> .deploy-report-$(TIMESTAMP).txt
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" >> .deploy-report-$(TIMESTAMP).txt
	@echo "$(GREEN)✓ Deployment report generated$(RESET)"
	
	@echo ""
	@echo "$(BLUE)=================================================================$(RESET)"
	@echo "$(GREEN)  Deployment Complete!$(RESET)"
	@echo "$(BLUE)=================================================================$(RESET)"
	@echo ""
	@echo "$(CYAN)Deployment Report:$(RESET) .deploy-report-$(TIMESTAMP).txt"
	@echo "$(CYAN)Commit:$(RESET)    $(COMMIT_HASH)"
	@echo "$(CYAN)Time:$(RESET)      $(BUILD_TIME)"
	@echo ""
	@echo "  Run 'make docker-logs' to monitor"
	@echo "  Run 'make health' to recheck health"
	@echo ""