# Backend APIs Missing Frontend Implementation

This document lists all backend API endpoints that don't have corresponding frontend UI components.

## Summary

- **Total Backend APIs**: 83 endpoints
- **APIs with Frontend**: ~40 endpoints
- **APIs Missing Frontend**: ~43 endpoints
- **Covered in PR-37, PR-38, PR-39**: 20+ endpoints

---

## Weather Analytics APIs (PR-37)

| Endpoint | Method | Status | Frontend Component |
|----------|--------|--------|-------------------|
| `/api/weather/analytics/monthly-patterns` | GET | ✅ Backend | ❌ Missing |
| `/api/weather/analytics/airport-patterns` | GET | ✅ Backend | ❌ Missing |
| `/api/weather/analytics/cancellation-trends` | GET | ✅ Backend | ❌ Missing |
| `/api/weather/analytics/optimal-windows` | GET | ✅ Backend | ❌ Missing |
| `/api/weather/analytics/insights` | GET | ✅ Backend | ❌ Missing |
| `/api/weather/analytics/student-report/[studentId]` | GET | ✅ Backend | ❌ Missing |

**Note**: `WeatherAnalyticsDashboard` exists but doesn't use all these endpoints.

---

## Currency Tracking APIs (PR-37)

| Endpoint | Method | Status | Frontend Component |
|----------|--------|--------|-------------------|
| `/api/currency/approaching-expiry` | GET | ✅ Backend | ⚠️ Partial (CurrencyDashboard exists) |
| `/api/currency/prioritized` | GET | ✅ Backend | ❌ Missing |

**Note**: `CurrencyDashboard` exists but may not use all endpoints.

---

## Maintenance APIs (PR-37)

| Endpoint | Method | Status | Frontend Component |
|----------|--------|--------|-------------------|
| `/api/maintenance/due` | GET | ✅ Backend | ⚠️ Partial (MaintenanceDashboard exists) |
| `/api/maintenance/history/[aircraftId]` | GET | ✅ Backend | ❌ Missing |

**Note**: `MaintenanceDashboard` exists but may not show history.

---

## Prediction APIs (PR-38)

| Endpoint | Method | Status | Frontend Component |
|----------|--------|--------|-------------------|
| `/api/predictions/cancellation` | POST | ✅ Backend | ⚠️ Partial (CancellationPredictionCard exists) |
| `/api/predictions/performance` | GET | ✅ Backend | ❌ Missing |
| `/api/predictions/retrain` | POST | ✅ Backend | ❌ Missing |

**Note**: `CancellationPredictionCard` exists but doesn't show performance metrics.

---

## Discovery Flight APIs (PR-38)

| Endpoint | Method | Status | Frontend Component |
|----------|--------|--------|-------------------|
| `/api/discovery-flights/[id]/survey` | POST | ✅ Backend | ⚠️ Partial (DiscoveryFlightDashboard exists) |
| `/api/discovery-flights/[id]/convert` | POST | ✅ Backend | ⚠️ Partial (DiscoveryFlightDashboard exists) |

**Note**: `DiscoveryFlightDashboard` exists but may not have full survey/conversion UI.

---

## Cache Management APIs (PR-38)

| Endpoint | Method | Status | Frontend Component |
|----------|--------|--------|-------------------|
| `/api/weather/cache/stats` | GET | ✅ Backend | ❌ Missing |
| `/api/weather/cache/warm` | POST | ✅ Backend | ❌ Missing |
| `/api/weather/cache/invalidate` | POST | ✅ Backend | ❌ Missing |

**Note**: These should be added to admin settings page.

---

## Sharding APIs (PR-39)

| Endpoint | Method | Status | Frontend Component |
|----------|--------|--------|-------------------|
| `/api/sharding/status` | GET | ✅ Backend | ⚠️ Partial (ShardMonitoringDashboard exists) |
| `/api/sharding/federate` | GET | ✅ Backend | ❌ Missing |
| `/api/sharding/rebalance` | POST | ✅ Backend | ❌ Missing |

**Note**: `ShardMonitoringDashboard` exists but may not use federated queries.

---

## Database Health APIs (PR-39)

| Endpoint | Method | Status | Frontend Component |
|----------|--------|--------|-------------------|
| `/api/db/health` | GET | ✅ Backend | ❌ Missing |
| `/api/db/stats` | GET | ✅ Backend | ❌ Missing |

**Note**: Should be added to admin dashboard.

---

## Audit Logs API (PR-39)

| Endpoint | Method | Status | Frontend Component |
|----------|--------|--------|-------------------|
| `/api/audit-logs` | GET | ✅ Backend | ⚠️ Partial (AuditLogViewer exists) |

**Note**: `AuditLogViewer` exists but may need filtering, export, and search.

---

## Calendar APIs (PR-33)

| Endpoint | Method | Status | Frontend Component |
|----------|--------|--------|-------------------|
| `/api/calendar/conflicts` | POST | ✅ Backend | ❌ Missing (needs UI integration) |

**Note**: API exists but not integrated into reschedule modal or flight list.

---

## Route Weather API (PR-34)

| Endpoint | Method | Status | Frontend Component |
|----------|--------|--------|-------------------|
| `/api/weather/route-check` | POST | ✅ Backend | ❌ Missing (needs visualization) |

**Note**: API exists but needs route visualization component.

---

## Watch List API

| Endpoint | Method | Status | Frontend Component |
|----------|--------|--------|-------------------|
| `/api/weather/watch-list` | GET | ✅ Backend | ⚠️ Partial (WatchList component exists) |

**Note**: `WatchList` component exists but may need enhancement.

---

## Forecast Confidence API

| Endpoint | Method | Status | Frontend Component |
|----------|--------|--------|-------------------|
| `/api/weather/forecast-confidence/[flightId]` | GET | ✅ Backend | ❌ Missing |

**Note**: Should be integrated into weather alerts or flight cards.

---

## SMS APIs

| Endpoint | Method | Status | Frontend Component |
|----------|--------|--------|-------------------|
| `/api/sms/costs` | GET | ✅ Backend | ⚠️ Partial (SMSSettings exists) |
| `/api/sms/verify` | POST | ✅ Backend | ⚠️ Partial (SMSSettings exists) |
| `/api/sms/opt-out` | POST | ✅ Backend | ⚠️ Partial (SMSSettings exists) |

**Note**: `SMSSettings` component exists but may need enhancement.

---

## School Management APIs

| Endpoint | Method | Status | Frontend Component |
|----------|--------|--------|-------------------|
| `/api/schools/onboard` | POST | ✅ Backend | ⚠️ Partial (SchoolOnboardingWizard exists) |
| `/api/schools/[id]` | GET/PATCH | ✅ Backend | ⚠️ Partial (SchoolManagement exists) |

**Note**: Components exist but may need full CRUD UI.

---

## Cross-School Analytics API

| Endpoint | Method | Status | Frontend Component |
|----------|--------|--------|-------------------|
| `/api/analytics/cross-school` | GET | ✅ Backend | ❌ Missing |

**Note**: Should be added to super admin dashboard.

---

## Weather Cost Tracking API

| Endpoint | Method | Status | Frontend Component |
|----------|--------|--------|-------------------|
| `/api/admin/weather-costs` | GET | ✅ Backend | ❌ Missing |

**Note**: Should be added to admin settings page.

---

## Job APIs (Admin Only)

| Endpoint | Method | Status | Frontend Component |
|----------|--------|--------|-------------------|
| `/api/jobs/hourly-weather` | POST | ✅ Backend | ⚠️ Partial (manual refresh exists) |
| `/api/jobs/currency-check` | POST | ✅ Backend | ❌ Missing |
| `/api/jobs/maintenance-reminder` | POST | ✅ Backend | ❌ Missing |
| `/api/jobs/prediction-generation` | POST | ✅ Backend | ❌ Missing |
| `/api/jobs/reschedule-expiration` | POST | ✅ Backend | ❌ Missing |

**Note**: These are background jobs but could have manual trigger UI in admin settings.

---

## Priority Summary

### High Priority (User-Facing)
1. Calendar conflict detection UI (PR-33)
2. Route visualization (PR-34)
3. Weather analytics endpoints (PR-37)
4. Forecast confidence display

### Medium Priority (Feature Completion)
1. Currency tracking enhancements (PR-37)
2. Maintenance history (PR-37)
3. Prediction performance metrics (PR-38)
4. Discovery flight survey/conversion (PR-38)
5. Cache management UI (PR-38)

### Low Priority (Admin/Advanced)
1. Sharding federated queries (PR-39)
2. Database health dashboard (PR-39)
3. Audit log enhancements (PR-39)
4. Cross-school analytics (PR-39)
5. Job manual triggers (admin settings)

---

## Notes

- Many components exist but may not use all available endpoints
- Some APIs are background jobs and may not need UI
- Admin-only features are lower priority but still valuable
- Market research recommendations (PR-32, PR-33, PR-34) are high priority

