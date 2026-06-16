.PHONY: up down restart logs ps build clean \
	socket-up socket-down socket-logs socket-restart \
	gateway-up gateway-down gateway-logs \
	auth-up auth-down auth-logs \
	tenant-up tenant-down tenant-logs \
	deceased-up deceased-down deceased-logs \
	marketplace-up marketplace-down marketplace-logs \
	invoice-up invoice-down invoice-logs \
	coffin-up coffin-down coffin-logs \
	documents-up documents-down documents-logs \
	edocuments-up edocuments-down edocuments-logs \
	analytics-up analytics-down analytics-logs \
	calender-up calender-down calender-logs \
	mpesa-up mpesa-down mpesa-logs mpesa-restart \
	notification-up notification-down notification-logs \
	qrcode-up qrcode-down qrcode-logs \
	visitors-up visitors-down visitors-logs \
	bodycheckout-up bodycheckout-down bodycheckout-logs \
	extra-up extra-down extra-logs \
	updates-up updates-down updates-logs \
	call-up call-down call-logs \
	portal-up portal-down portal-logs \
	chemical-up chemical-down chemical-logs \
	frontend-up frontend-down frontend-logs \
	status help

# ============================================
# GENERAL COMMANDS
# ============================================

up: ## Start all services
	docker compose up -d --build

down: ## Stop all services
	docker compose down

restart: ## Restart all services
	docker compose restart

logs: ## Show logs for all services
	docker compose logs -f

ps: ## Show status of all services
	docker compose ps

build: ## Build all services without starting
	docker compose build

clean: ## Stop and remove all containers, networks, but preserve volumes
	docker compose down

# ============================================
# SOCKET.IO SPECIFIC
# ============================================

socket-up: ## Start only socketio-service
	docker compose up -d socketio-service

socket-down: ## Stop socketio-service
	docker compose stop socketio-service

socket-logs: ## Show socketio-service logs
	docker compose logs -f socketio-service

socket-restart: ## Restart socketio-service
	docker compose restart socketio-service

# ============================================
# API GATEWAY
# ============================================

gateway-up: ## Start api-gateway only
	docker compose up -d restpoint-gateway

gateway-down: ## Stop api-gateway
	docker compose stop restpoint-gateway

gateway-logs: ## Show api-gateway logs
	docker compose logs -f restpoint-gateway

# ============================================
# AUTH SERVICE
# ============================================

auth-up: ## Start auth-service only
	docker compose up -d auth-service

auth-down: ## Stop auth-service
	docker compose stop auth-service

auth-logs: ## Show auth-service logs
	docker compose logs -f auth-service

# ============================================
# TENANT SERVICE
# ============================================

tenant-up: ## Start tenant-service only
	docker compose up -d tenant-service

tenant-down: ## Stop tenant-service
	docker compose stop tenant-service

tenant-logs: ## Show tenant-service logs
	docker compose logs -f tenant-service

# ============================================
# DECEASED SERVICE
# ============================================

deceased-up: ## Start deceased-service only
	docker compose up -d deceased-service

deceased-down: ## Stop deceased-service
	docker compose stop deceased-service

deceased-logs: ## Show deceased-service logs
	docker compose logs -f deceased-service

# ============================================
# MARKETPLACE SERVICE
# ============================================

marketplace-up: ## Start marketplace-service only
	docker compose up -d marketplace-service

marketplace-down: ## Stop marketplace-service
	docker compose stop marketplace-service

marketplace-logs: ## Show marketplace-service logs
	docker compose logs -f marketplace-service

# ============================================
# INVOICE SERVICE
# ============================================

invoice-up: ## Start invoice-service only
	docker compose up -d invoice-service

invoice-down: ## Stop invoice-service
	docker compose stop invoice-service

invoice-logs: ## Show invoice-service logs
	docker compose logs -f invoice-service

# ============================================
# COFFIN SERVICE
# ============================================

coffin-up: ## Start coffin-service only
	docker compose up -d coffin-service

coffin-down: ## Stop coffin-service
	docker compose stop coffin-service

coffin-logs: ## Show coffin-service logs
	docker compose logs -f coffin-service

# ============================================
# DOCUMENTS SERVICE
# ============================================

documents-up: ## Start documents-service only
	docker compose up -d documents-service

documents-down: ## Stop documents-service
	docker compose stop documents-service

documents-logs: ## Show documents-service logs
	docker compose logs -f documents-service

# ============================================
# EDOCUMENTS SERVICE
# ============================================

edocuments-up: ## Start edocuments-service only
	docker compose up -d edocuments-service

edocuments-down: ## Stop edocuments-service
	docker compose stop edocuments-service

edocuments-logs: ## Show edocuments-service logs
	docker compose logs -f edocuments-service

# ============================================
# ANALYTICS SERVICE
# ============================================

analytics-up: ## Start analytics-service only
	docker compose up -d analytics-service

analytics-down: ## Stop analytics-service
	docker compose stop analytics-service

analytics-logs: ## Show analytics-service logs
	docker compose logs -f analytics-service

# ============================================
# CALENDER SERVICE
# ============================================

calender-up: ## Start calender-service only
	docker compose up -d calender-service

calender-down: ## Stop calender-service
	docker compose stop calender-service

calender-logs: ## Show calender-service logs
	docker compose logs -f calender-service

# ============================================
# MPESA SERVICE
# ============================================

mpesa-up: ## Start mpesa-service only
	docker compose up -d mpesa-service

mpesa-down: ## Stop mpesa-service
	docker compose stop mpesa-service

mpesa-logs: ## Show mpesa-service logs
	docker compose logs -f mpesa-service

mpesa-restart: ## Restart mpesa-service
	docker compose restart mpesa-service

# ============================================
# NOTIFICATION SERVICE
# ============================================

notification-up: ## Start notification-service only
	docker compose up -d notification-service

notification-down: ## Stop notification-service
	docker compose stop notification-service

notification-logs: ## Show notification-service logs
	docker compose logs -f notification-service

# ============================================
# QR CODE SERVICE
# ============================================

# qrcode-up: ## Start qrcode-service only
# 	docker compose up -d qrcode-service

# qrcode-down: ## Stop qrcode-service
# 	docker compose stop qrcode-service

# qrcode-logs: ## Show qrcode-service logs
# 	docker compose logs -f qrcode-service

# ============================================
# VISITORS SERVICE
# ============================================

visitors-up: ## Start visitors-service only
	docker compose up -d visitors-service

visitors-down: ## Stop visitors-service
	docker compose stop visitors-service

visitors-logs: ## Show visitors-service logs
	docker compose logs -f visitors-service

# ============================================
# BODYCHECKOUT SERVICE
# ============================================

bodycheckout-up: ## Start bodycheckout-service only
	docker compose up -d bodycheckout-service

bodycheckout-down: ## Stop bodycheckout-service
	docker compose stop bodycheckout-service

bodycheckout-logs: ## Show bodycheckout-service logs
	docker compose logs -f bodycheckout-service

# ============================================
# EXTRA SERVICES
# ============================================

# extra-up: ## Start extra-services only
# 	docker compose up -d extra-services

# extra-down: ## Stop extra-services
# 	docker compose stop extra-services

# extra-logs: ## Show extra-services logs
# 	docker compose logs -f extra-services

# ============================================
# UPDATES SERVICE
# ============================================

updates-up: ## Start updates-service only
	docker compose up -d updates-service

updates-down: ## Stop updates-service
	docker compose stop updates-service

updates-logs: ## Show updates-service logs
	docker compose logs -f updates-service

# ============================================
# CALL SERVICE
# ============================================

call-up: ## Start call-service only
	docker compose up -d call-service

call-down: ## Stop call-service
	docker compose stop call-service

call-logs: ## Show call-service logs
	docker compose logs -f call-service

# ============================================
# PORTAL SERVICE
# ============================================

portal-up: ## Start portal-service only
	docker compose up -d portal-service

portal-down: ## Stop portal-service
	docker compose stop portal-service

portal-logs: ## Show portal-service logs
	docker compose logs -f portal-service

# ============================================
# CHEMICAL SERVICE
# ============================================

chemical-up: ## Start chemical-service only
	docker compose up -d chemical-service

chemical-down: ## Stop chemical-service
	docker compose stop chemical-service

chemical-logs: ## Show chemical-service logs
	docker compose logs -f chemical-service

# ============================================
# FRONTEND
# ============================================

frontend-up: ## Start frontend only
	docker compose up -d frontend

frontend-down: ## Stop frontend
	docker compose stop frontend

frontend-logs: ## Show frontend logs
	docker compose logs -f frontend

# ============================================
# STATUS CHECK
# ============================================

status: ## Show detailed status of all services
	@echo "=== Container Status ==="
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@echo "=== Service Health ==="
	@curl -s http://localhost:5000/health 2>/dev/null && echo "✅ API Gateway (5000)" || echo "❌ API Gateway (5000)"
	@curl -s http://localhost:5013/health 2>/dev/null && echo "✅ Socket.IO (5013)" || echo "❌ Socket.IO (5013)"
	@curl -s http://localhost:5011/health 2>/dev/null && echo "✅ M-Pesa Service (5011)" || echo "❌ M-Pesa Service (5011)"
	@curl -s http://localhost:5105/health 2>/dev/null && echo "✅ Chemical Service (5105)" || echo "❌ Chemical Service (5105)"
	@curl -s http://localhost:5111/health 2>/dev/null && echo "✅ Notification Service (5111)" || echo "❌ Notification Service (5111)"
	@curl -s http://localhost:8082 2>/dev/null && echo "✅ Frontend (8082)" || echo "❌ Frontend (8082)"

# ============================================
# HELP
# ============================================

help: ## Show help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'