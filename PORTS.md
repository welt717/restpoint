# Restpoint Platform - Port Registry

## Service Port Allocation

| Port | Service | Container | Status |
|------|---------|-----------|--------|
| 3306 | MariaDB | restpoint_db | Active |
| 5000 | restpoint-gateway | restpoint_gateway | Active |
| 5001 | auth-service | restpoint_auth | Active |
| 5002 | tenant-service | restpoint_tenant | Active |
| 5003 | deceased-service | restpoint_deceased | Active |
| 5004 | marketplace-service | restpoint_marketplace | Active |
| 5005 | invoice-service | restpoint_invoice | Active |
| 5006 | coffin-service | restpoint_coffin | Active |
| 5007 | documents-service | restpoint_documents | Active |
| 5008 | edocuments-service | restpoint_edocuments | Active |
| 5009 | analytics-service | restpoint_analytics | Active |
| 5010 | calender-service | restpoint_calender | Active |
| 5011 | mpesa-service | restpoint_mpesa | Active |
| 5012 | qrcode-service | restpoint_qrcode | Active |
| 5013 | socketio-service | restpoint_socketio | Active |
| 5014 | visitors-service | restpoint_visitors | Active |
| 5015 | bodycheckout-service | restpoint_bodycheckout | Active |
| 5016 | extra-services | restpoint_extra | Active |
| 5017 | updates-service | restpoint_updates | Active |
| 5018 | call-service | restpoint_call | Active |
| 5019 | portal-service | restpoint_portal | Active |
| 5105 | chemical-service | restpoint_chemical | Active |
| 5111 | notification-service | restpoint_notification | Active |
| 6379 | Redis | restpoint_redis | Active |
| 8082 | Frontend (Nginx) | restpoint_frontend | Active |

## Port Conflicts Detected

- **chemical-service** (5105) and **embalming** reference the same port - this is intentional as the chemical service handles embalming
- Some services use both `5000-5019` and `5100-5119` ranges without overlap

## Unused Ports

- 5020 (search service referenced in gateway but not in Docker)
- 5107 (coldroom service referenced in gateway but not in Docker)
- 5109 (hearse service referenced in gateway but not in Docker)
- 5114 (reports service referenced in gateway but not in Docker)
- 5116 (edocuments alternate port referenced in gateway)

## Recommendations

1. Remove unused services from gateway configuration or create them
2. Consider using non-overlapping port ranges for different service groups
3. Standardize on a single port range (5000-5020 for core, 5100-5120 for auxiliary)
4. Verify notification service on port 5111 doesn't conflict with future services