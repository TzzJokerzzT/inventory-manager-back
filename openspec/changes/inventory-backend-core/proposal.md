# Proposal: Inventory Backend Core

## Intent

Build a greenfield inventory management REST API with Clean Architecture. Provide tracked product stock, movements, purchase orders, and role-based access control via 30+ endpoints.

## Scope

### In Scope
- 6 implementation phases ending with full 30+ endpoint API
- JWT auth with access/refresh tokens and rotation
- RBAC (admin, operador, solo_lectura)
- PostgreSQL schema with 12 tables
- Clean Architecture (domain → application → infrastructure → presentation)
- Rate limiting, Helmet, CORS, Valibot validation

### Out of Scope
- Frontend integration (API-only delivery)
- Real-time notifications / WebSockets
- Multi-warehouse support
- Advanced analytics / BI dashboards

## Capabilities

### New Capabilities
- `auth`: JWT login, refresh, logout with httpOnly cookies
- `products`: CRUD, image upload, import/export
- `inventory`: Stock queries, low-stock alerts, min/max levels
- `movements`: Entry/exit tracking with 6 movement types
- `purchases`: Suppliers, purchase orders, goods receipt
- `reports`: Inventory value, rotation, shrinkage, exports
- `users`: RBAC user management

### Modified Capabilities
None (greenfield project)

## Approach

Express + pg driver with parametrized queries. Valibot for runtime validation. Vitest for testing. Biome for lint/format. Manual DI container. Domain errors mapped to HTTP codes by global error handler.

## Phased Delivery

| Phase | Scope | Approx. Lines |
|-------|-------|---------------|
| **1 — Bootstrap + Auth Foundation** | Project config, DB schema (roles/users/refresh_tokens), seed, Express server, JWT service, login/logout/refresh, health check | ~350 |
| **2 — Categories & Products** | Category CRUD, Product CRUD with filters/pagination, soft delete | ~400 |
| **3 — Stock & Movements** | Stock queries, min/max config, movement entry/exit, low-stock alerts | ~400 |
| **4 — Suppliers & Purchases** | Supplier CRUD, purchase order lifecycle, goods receipt → auto movement | ~400 |
| **5 — Reports** | Inventory value, rotation, shrinkage, movement summary, CSV/XLSX export | ~350 |
| **6 — Users + Polish** | User CRUD, role changes, image upload, import/export CSV, final tests | ~350 |

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/` | New | Entities, value objects, repository interfaces |
| `src/application/` | New | Use cases orchestrating domain logic |
| `src/infrastructure/` | New | Express server, pg repositories, middleware, services |
| `src/presentation/` | New | Thin controllers |
| `src/shared/` | New | Errors, types, constants |
| `migrations/` | New | Sequential SQL schema files |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Auth cookie CORS issues | Med | Test with frontend origin in Phase 1 |
| Soft-delete data leaks | Med | Centralize `active = TRUE` filtering in repositories |
| Stock race conditions | Med | Use DB transactions for all movement write ops |

## Rollback Plan

Each phase is independently deployable. Rollback = revert to previous phase commit + run down-migration if schema changed. Auth tokens are stateless; refresh token revocation is immediate via DB flag.

## Dependencies

- PostgreSQL ≥ 15
- Node.js ≥ 20

## Success Criteria

- [ ] All phases deployed with passing Vitest tests
- [ ] Unauthorized requests return 401/403
- [ ] Zero string-concatenated SQL (parametrized only)
- [ ] Rate limits enforced on public endpoints
- [ ] Helmet headers present on all responses
