# Spec: Inventory Backend Core

## Phase 1 — Bootstrap + Auth Foundation

### REQ-1.1: Project Configuration & Build Setup

**Description:** Initialize the project with TypeScript strict mode, Express, pg, Valibot, Vitest, Biome, and environment configuration. Provide `dev`, `build`, `start`, `db:migrate`, `db:seed`, `test`, `lint`, and `format` scripts using Bun.

**Acceptance Scenarios:**

- **Given** a fresh clone of the repository
  **When** `bun install` is run
  **Then** all dependencies are installed without errors
- **Given** the project is configured
  **When** `bun run dev` is executed
  **Then** the server starts on port 4000 and logs a startup message
- **Given** a `.env.example` file exists
  **When** it is copied to `.env` with valid PostgreSQL credentials
  **Then** the application reads all required environment variables on startup

---

### REQ-1.2: Database Schema — Roles, Users, Refresh Tokens

**Description:** Create PostgreSQL tables for `roles`, `users`, and `refresh_tokens` with UUID primary keys, proper foreign keys, constraints, and indexes. Use sequential migration files with UP and DOWN sections.

**Acceptance Scenarios:**

- **Given** the migration is run against an empty PostgreSQL database
  **When** `npm run db:migrate` executes
  **Then** tables `roles`, `users`, and `refresh_tokens` are created with correct columns, types, and constraints
- **Given** the migration has been applied
  **When** the down-migration is run
  **Then** all three tables are dropped without errors
- **Given** the schema exists
  **When** a user is inserted with a duplicate email
  **Then** the database rejects it with a unique constraint violation

---

### REQ-1.3: Database Seed — Default Roles & Admin User

**Description:** Seed script that inserts the three roles (`admin`, `operador`, `solo_lectura`) and a default admin user with a hashed password. Idempotent — safe to run multiple times.

**Acceptance Scenarios:**

- **Given** a fresh database with migrations applied
  **When** `npm run db:seed` is executed
  **Then** exactly 3 roles exist and 1 admin user is created
- **Given** the seed has already been run once
  **When** `npm run db:seed` is executed again
  **Then** no duplicate roles or users are created (idempotent)
- **Given** a seeded admin user exists
  **When** the admin attempts login with the default password
  **Then** authentication succeeds

---

### REQ-1.4: Express Server Setup with Security Middleware

**Description:** Configure Express with Helmet (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy), CORS with explicit origin whitelist and credentials, JSON body parsing, Morgan logging, and a global error handler. Server listens on configurable port (default 4000).

**Acceptance Scenarios:**

- **Given** the server is running
  **When** a GET request is sent to `/api/health`
  **Then** the response is `200` with body `{ "status": "ok" }`
- **Given** the server is running
  **When** any response is inspected
  **Then** Helmet security headers are present (`X-Frame-Options: DENY`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`)
- **Given** CORS is configured with `CORS_ORIGIN=http://localhost:3000`
  **When** a request originates from `http://localhost:3000` with credentials
  **Then** the response includes `Access-Control-Allow-Origin: http://localhost:3000` and `Access-Control-Allow-Credentials: true`
- **Given** a request originates from an unlisted origin
  **When** it is sent to the server
  **Then** CORS blocks the request (no wildcard `*`)

---

### REQ-1.5: JWT Service — Access & Refresh Token Generation

**Description:** Implement `JwtService` that generates access tokens (15 min expiry, signed with `JWT_ACCESS_SECRET`) and refresh tokens (7 day expiry, signed with `JWT_REFRESH_SECRET`). Tokens include `userId`, `email`, and `role` claims. Refresh tokens are stored hashed in `refresh_tokens` table.

**Acceptance Scenarios:**

- **Given** valid user credentials
  **When** `JwtService.generateAccessToken(user)` is called
  **Then** a JWT is returned containing `userId`, `email`, and `role` with 15-minute expiry
- **Given** a valid user
  **When** `JwtService.generateRefreshToken(user)` is called
  **Then** a JWT is returned with 7-day expiry and its hash is stored in `refresh_tokens`
- **Given** an expired access token
  **When** it is verified
  **Then** verification fails with an expiration error

---

### REQ-1.6: POST /api/auth/login

**Description:** Public endpoint accepting `email` and `password`. Validates input with Valibot. On success, returns access token in body and sets refresh token as `httpOnly`, `Secure`, `SameSite=Strict` cookie. On failure, returns generic "Invalid credentials" (no user enumeration).

**Acceptance Scenarios:**

- **Given** a valid admin user exists in the database
  **When** POST `/api/auth/login` is sent with correct email and password
  **Then** response is `200` with `{ "accessToken": "<jwt>", "user": { "id", "email", "name", "role" } }` and a `Set-Cookie` header containing the refresh token with `httpOnly` and `Secure` flags
- **Given** a valid user exists
  **When** POST `/api/auth/login` is sent with wrong password
  **Then** response is `401` with `{ "error": "INVALID_CREDENTIALS", "message": "Invalid credentials" }` (no hint about which field is wrong)
- **Given** no user exists with the provided email
  **When** POST `/api/auth/login` is sent
  **Then** response is `401` with the same generic error (no user enumeration)
- **Given** the request body is missing `email`
  **When** POST `/api/auth/login` is sent
  **Then** response is `400` with validation error details

---

### REQ-1.7: POST /api/auth/refresh

**Description:** Public endpoint that reads the refresh token from the `httpOnly` cookie, validates it, rotates both tokens (issues new access + refresh), and revokes the old refresh token. Implements refresh token rotation for security.

**Acceptance Scenarios:**

- **Given** a valid refresh token cookie exists
  **When** POST `/api/auth/refresh` is called
  **Then** response is `200` with a new access token and a new `Set-Cookie` with the rotated refresh token; the old refresh token is marked `revoked = TRUE`
- **Given** a refresh token that has already been used (revoked)
  **When** POST `/api/auth/refresh` is called
  **Then** response is `401` and ALL tokens for that user are revoked (detect reuse attack)
- **Given** no refresh token cookie is present
  **When** POST `/api/auth/refresh` is called
  **Then** response is `401` with "No refresh token provided"

---

### REQ-1.8: POST /api/auth/logout

**Description:** Authenticated endpoint that revokes the current refresh token by setting `revoked = TRUE` in the database and clears the cookie.

**Acceptance Scenarios:**

- **Given** a user is authenticated with a valid refresh token
  **When** POST `/api/auth/logout` is called
  **Then** the refresh token is marked `revoked = TRUE`, the cookie is cleared, and response is `200`
- **Given** the same refresh token is used after logout
  **When** POST `/api/auth/refresh` is called
  **Then** response is `401` (token was revoked)

---

### REQ-1.9: Auth Middleware (JWT Verification)

**Description:** Middleware that extracts the Bearer token from `Authorization` header, verifies it with `JWT_ACCESS_SECRET`, attaches `userId`, `email`, and `role` to `req.user`, and passes to next handler. Returns 401 on missing/invalid/expired tokens.

**Acceptance Scenarios:**

- **Given** a valid access token in `Authorization: Bearer <token>`
  **When** a protected route is accessed
  **Then** `req.user` contains `{ userId, email, role }` and the request proceeds
- **Given** no Authorization header is present
  **When** a protected route is accessed
  **Then** response is `401` with `{ "error": "UNAUTHORIZED", "message": "No token provided" }`
- **Given** an expired access token
  **When** a protected route is accessed
  **Then** response is `401` with `{ "error": "TOKEN_EXPIRED", "message": "Token has expired" }`

---

### REQ-1.10: RBAC Middleware

**Description:** Middleware factory `rbac(allowedRoles: string[])` that checks `req.user.role` against the allowed roles list. Returns 403 if the user's role is not in the list.

**Acceptance Scenarios:**

- **Given** a user with role `admin`
  **When** accessing a route protected by `rbac(['admin', 'operador'])`
  **Then** the request proceeds (200 or downstream handler response)
- **Given** a user with role `solo_lectura`
  **When** accessing a route protected by `rbac(['admin', 'operador'])`
  **Then** response is `403` with `{ "error": "FORBIDDEN", "message": "Insufficient permissions" }`
- **Given** an unauthenticated request (no `req.user`)
  **When** accessing a RBAC-protected route
  **Then** response is `401` (auth middleware catches it first)

---

### REQ-1.11: Rate Limiting

**Description:** Three rate limit tiers using `express-rate-limit`: public endpoints (20 req/15 min), authenticated endpoints (1000 req/15 min), and import endpoints (10 req/15 min). Returns standard 429 response with `Retry-After` header.

**Acceptance Scenarios:**

- **Given** the public rate limit is 20 requests per 15 minutes
  **When** 21 requests are sent to `/api/auth/login` within 15 minutes
  **Then** the 21st request returns `429` with `Retry-After` header
- **Given** an authenticated user
  **When** they send requests within the 1000 req/15 min limit
  **Then** all requests succeed (not rate-limited)

---

### REQ-1.12: Global Error Handler & Domain Error Classes

**Description:** Implement domain error classes (`NotFoundError` → 404, `ValidationError` → 400, `UnauthorizedError` → 401, `ForbiddenError` → 403, `ConflictError` → 409) and a global Express error handler that maps them to HTTP responses. In production, stack traces and internal details are never exposed.

**Acceptance Scenarios:**

- **Given** a use case throws `NotFoundError("Product not found")`
  **When** the error reaches the global handler
  **Then** response is `404` with `{ "error": "NOT_FOUND", "message": "Product not found" }`
- **Given** `NODE_ENV=production`
  **When** an unhandled exception occurs
  **Then** response is `500` with `{ "error": "INTERNAL_ERROR", "message": "Internal server error" }` (no stack trace)
- **Given** `NODE_ENV=development`
  **When** an unhandled exception occurs
  **Then** response is `500` with the stack trace included for debugging

---

## Phase 2 — Categories & Products

### REQ-2.1: Database Schema — Categories & Products

**Description:** Create `categories` and `products` tables with all columns specified in the README schema. Products include `active` boolean for soft delete, `image_url`, `cost_price`, `sale_price`, `stock`, `min_stock`, `max_stock`, and audit fields (`created_by`, `created_at`, `updated_at`).

**Acceptance Scenarios:**

- **Given** the migration runs
  **When** both tables are created
  **Then** `products.reference` is unique, `products.category_id` is a nullable FK to `categories`, and `products.active` defaults to `TRUE`
- **Given** a product is soft-deleted (`active = FALSE`)
  **When** a query for active products is run
  **Then** the deleted product is excluded from results

---

### REQ-2.2: Category Entity & CRUD Use Cases

**Description:** Domain entity `Category` with `id`, `name`, `description`. Repository interface `ICategoryRepository` with `create`, `findById`, `findAll`, `update`, `delete`. PostgreSQL implementation with parametrized queries.

**Acceptance Scenarios:**

- **Given** a valid category name
  **When** `createCategory` use case is executed
  **Then** the category is persisted and returned with generated UUID
- **Given** a category name that already exists
  **When** `createCategory` is executed
  **Then** a `ConflictError` is thrown (unique constraint)
- **Given** a category exists
  **When** `findAllCategories` is called
  **Then** all categories are returned ordered by name

---

### REQ-2.3: Product Entity & Create Use Case

**Description:** Domain entity `Product` with business logic for stock validation (min_stock ≤ max_stock). Valibot schema validates `name` (1-200 chars), `reference` (1-100 chars), `cost_price` (≥ 0), `sale_price` (nullable, ≥ 0), `min_stock` (≥ 0), `max_stock` (≥ 1).

**Acceptance Scenarios:**

- **Given** valid product data
  **When** `createProduct` use case is executed
  **Then** the product is created with `stock = 0`, `active = TRUE`, and `created_by` set to the authenticated user's ID
- **Given** `min_stock > max_stock` in the request
  **When** `createProduct` is executed
  **Then** a `ValidationError` is returned
- **Given** a `reference` that already exists
  **When** `createProduct` is executed
  **Then** a `ConflictError` is thrown

---

### REQ-2.4: Product Read — List with Pagination, Search & Filters

**Description:** `GET /api/products` supports pagination (`page`, `limit`), text search on `name` and `reference`, filter by `category_id`, and filter by `active` status. Returns paginated response with `total`, `page`, `limit`, `pages` metadata.

**Acceptance Scenarios:**

- **Given** 50 products exist in the database
  **When** `GET /api/products?page=1&limit=10` is called
  **Then** response contains 10 products and `pagination: { page: 1, limit: 10, total: 50, pages: 5 }`
- **Given** products with names containing "laptop"
  **When** `GET /api/products?search=laptop` is called
  **Then** only matching products are returned
- **Given** some products are soft-deleted (`active = FALSE`)
  **When** `GET /api/products` is called without `active=false` filter
  **Then** only active products are returned by default

---

### REQ-2.5: Product Read — Get by ID

**Description:** `GET /api/products/:id` returns full product detail including category name. Returns 404 if not found or soft-deleted.

**Acceptance Scenarios:**

- **Given** a product exists and is active
  **When** `GET /api/products/:id` is called
  **Then** response is `200` with full product data including `category.name`
- **Given** a product ID that does not exist
  **When** `GET /api/products/:id` is called
  **Then** response is `404`
- **Given** a product that is soft-deleted
  **When** `GET /api/products/:id` is called
  **Then** response is `404` (treated as not found)

---

### REQ-2.6: Product Update

**Description:** `PUT /api/products/:id` allows updating mutable fields (`name`, `reference`, `category_id`, `description`, `cost_price`, `sale_price`). Returns updated product. Validates reference uniqueness on change.

**Acceptance Scenarios:**

- **Given** a product exists
  **When** `PUT /api/products/:id` is called with valid updated fields
  **Then** response is `200` with the updated product and `updated_at` reflects the change
- **Given** the new reference is already used by another product
  **When** `PUT /api/products/:id` is called
  **Then** response is `409` (conflict)

---

### REQ-2.7: Product Soft Delete

**Description:** `DELETE /api/products/:id` sets `active = FALSE` instead of removing the row. Admin-only access. Soft-deleted products are excluded from all list/get queries by default.

**Acceptance Scenarios:**

- **Given** an admin user and an active product
  **When** `DELETE /api/products/:id` is called
  **Then** `active` is set to `FALSE`, response is `200` with `{ "message": "Product deleted" }`
- **Given** a soft-deleted product
  **When** `GET /api/products` is called
  **Then** the product does not appear in results
- **Given** a non-admin user
  **When** `DELETE /api/products/:id` is called
  **Then** response is `403`

---

## Phase 3 — Stock & Movements

### REQ-3.1: Database Schema — Inventory Movements

**Description:** Create `inventory_movements` table with `movement_type` ENUM (`purchase`, `return`, `sale`, `shrinkage`, `adjustment_in`, `adjustment_out`), FK to `products` and `users`, `quantity`, `reason`, `reference_doc`, and `created_at`.

**Acceptance Scenarios:**

- **Given** the migration runs
  **When** the `inventory_movements` table is created
  **Then** the `movement_type` ENUM has all 6 values and `quantity` must be positive (> 0)
- **Given** a product that does not exist
  **When** an insert is attempted with that `product_id`
  **Then** the database rejects it with a foreign key violation

---

### REQ-3.2: Stock Query — Current Stock

**Description:** `GET /api/products/:id/stock` returns current stock level, min/max thresholds, and whether stock is below minimum.

**Acceptance Scenarios:**

- **Given** a product with `stock = 50`, `min_stock = 10`, `max_stock = 100`
  **When** `GET /api/products/:id/stock` is called
  **Then** response is `{ "productId", "stock": 50, "minStock": 10, "maxStock": 100, "isLowStock": false }`
- **Given** a product with `stock = 5`, `min_stock = 10`
  **When** `GET /api/products/:id/stock` is called
  **Then** `isLowStock` is `true`

---

### REQ-3.3: Stock Level Configuration

**Description:** `PUT /api/products/:id/stock/levels` allows admin/operator to update `min_stock` and `max_stock`. Validates `min_stock < max_stock`.

**Acceptance Scenarios:**

- **Given** a product with `min_stock = 10`, `max_stock = 100`
  **When** `PUT /api/products/:id/stock/levels` is called with `{ "minStock": 20, "maxStock": 200 }`
  **Then** the levels are updated and response is `200`
- **Given** `min_stock >= max_stock` in the request
  **When** the endpoint is called
  **Then** response is `400` with validation error

---

### REQ-3.4: Low Stock Alert Endpoint

**Description:** `GET /api/products/low-stock` returns all active products where `stock <= min_stock`. Supports pagination.

**Acceptance Scenarios:**

- **Given** 3 products have stock below their minimum
  **When** `GET /api/products/low-stock` is called
  **Then** exactly those 3 products are returned
- **Given** no products are below minimum
  **When** `GET /api/products/low-stock` is called
  **Then** an empty array is returned with `pagination.total = 0`

---

### REQ-3.5: Movement Entry (Stock Increase)

**Description:** `POST /api/movements/entry` registers a stock-in movement. Accepts `productId`, `type` (`purchase`, `return`, `adjustment_in`), `quantity`, `reason`, `reference_doc`. Atomically increments product stock and creates movement record in a single transaction.

**Acceptance Scenarios:**

- **Given** a product with `stock = 100`
  **When** `POST /api/movements/entry` is called with `{ "productId": "...", "type": "purchase", "quantity": 50 }`
  **Then** product stock becomes `150` and a movement record is created with `created_by` set to the authenticated user
- **Given** the product does not exist
  **When** the entry endpoint is called
  **Then** response is `404`
- **Given** `quantity <= 0`
  **When** the entry endpoint is called
  **Then** response is `400` with validation error
- **Given** two concurrent entry requests for the same product
  **When** both are processed
  **Then** both increments are applied correctly (no race condition — uses DB transaction)

---

### REQ-3.6: Movement Exit (Stock Decrease)

**Description:** `POST /api/movements/exit` registers a stock-out movement. Accepts `productId`, `type` (`sale`, `shrinkage`, `adjustment_out`), `quantity`, `reason`, `reference_doc`. Atomically decrements stock and creates movement record. Rejects if insufficient stock.

**Acceptance Scenarios:**

- **Given** a product with `stock = 100`
  **When** `POST /api/movements/exit` is called with `{ "productId": "...", "type": "sale", "quantity": 30 }`
  **Then** product stock becomes `70` and a movement record is created
- **Given** a product with `stock = 10`
  **When** `POST /api/movements/exit` is called with `{ "quantity": 15 }`
  **Then** response is `400` with `{ "error": "INSUFFICIENT_STOCK", "message": "Insufficient stock. Available: 10, Requested: 15" }` and stock is NOT modified

---

### REQ-3.7: Movement History with Filters

**Description:** `GET /api/movements` returns movement history with filters: `type`, `productId`, `dateFrom`, `dateTo`, `userId`. Pagination supported. `GET /api/movements/:id` returns single movement detail.

**Acceptance Scenarios:**

- **Given** 100 movements exist across different types and products
  **When** `GET /api/movements?type=purchase&dateFrom=2026-01-01` is called
  **Then** only purchase movements after the specified date are returned
- **Given** a movement ID that exists
  **When** `GET /api/movements/:id` is called
  **Then** full movement detail is returned including product name, user name, and type

---

## Phase 4 — Suppliers & Purchases

### REQ-4.1: Database Schema — Suppliers, Purchase Orders, Order Items

**Description:** Create `suppliers`, `purchase_orders`, and `purchase_order_items` tables. `order_status` ENUM: `pending`, `ordered`, `received`, `cancelled`. Purchase order items link to products with `quantity`, `unit_price`, `received_quantity`.

**Acceptance Scenarios:**

- **Given** the migration runs
  **When** all three tables are created
  **Then** `purchase_order_items` has `ON DELETE CASCADE` to `purchase_orders`, and `order_status` defaults to `pending`
- **Given** a supplier is soft-deleted
  **When** a new purchase order references it
  **Then** the order can still be created (FK does not restrict by active status)

---

### REQ-4.2: Supplier CRUD

**Description:** Full CRUD for suppliers: `GET /api/suppliers` (list with pagination), `GET /api/suppliers/:id`, `POST /api/suppliers` (admin only), `PUT /api/suppliers/:id` (admin only). Soft delete via `active` flag. Fields: `name`, `contact_name`, `email`, `phone`, `address`, `payment_terms`, `notes`.

**Acceptance Scenarios:**

- **Given** valid supplier data
  **When** `POST /api/suppliers` is called by an admin
  **Then** supplier is created and returned with `201`
- **Given** a supplier exists
  **When** `GET /api/suppliers/:id` is called
  **Then** full supplier detail is returned
- **Given** a non-admin user
  **When** `POST /api/suppliers` is called
  **Then** response is `403`
- **Given** a supplier is soft-deleted
  **When** `GET /api/suppliers` is called
  **Then** the deleted supplier is excluded from results

---

### REQ-4.3: Purchase Order Creation

**Description:** `POST /api/purchases` creates a purchase order with line items. Accepts `supplierId`, `items: [{ productId, quantity, unitPrice }]`, `notes`. Calculates `total` from items. Status starts as `pending`. Admin only.

**Acceptance Scenarios:**

- **Given** a valid supplier and 2 products
  **When** `POST /api/purchases` is called with `{ "supplierId": "...", "items": [{ "productId": "...", "quantity": 10, "unitPrice": 25.50 }] }`
  **Then** a purchase order is created with `total = 255.00`, `status = "pending"`, and `201` is returned
- **Given** a product in the items does not exist
  **When** the endpoint is called
  **Then** response is `400` with validation error
- **Given** a non-admin user
  **When** `POST /api/purchases` is called
  **Then** response is `403`

---

### REQ-4.4: Purchase Order Status Transitions

**Description:** `PUT /api/purchases/:id/status` transitions order status. Valid transitions: `pending → ordered`, `ordered → received`, `pending → cancelled`, `ordered → cancelled`. Invalid transitions return 400. Admin only.

**Acceptance Scenarios:**

- **Given** an order with status `pending`
  **When** `PUT /api/purchases/:id/status` is called with `{ "status": "ordered" }`
  **Then** status changes to `ordered` and response is `200`
- **Given** an order with status `pending`
  **When** `PUT /api/purchases/:id/status` is called with `{ "status": "received" }`
  **Then** response is `400` with `{ "error": "INVALID_TRANSITION", "message": "Cannot transition from pending to received" }`
- **Given** an order with status `received`
  **When** `PUT /api/purchases/:id/status` is called with `{ "status": "cancelled" }`
  **Then** response is `400` (received orders cannot be cancelled)

---

### REQ-4.5: Goods Reception — Auto Movement Creation

**Description:** `POST /api/purchases/:id/receive` marks a purchase order as `received` and automatically creates `inventory_movements` entries (type `purchase`) for each order item, incrementing product stock. Uses DB transaction. Admin or operator role required.

**Acceptance Scenarios:**

- **Given** an order with status `ordered` containing 2 items (product A: qty 10, product B: qty 5)
  **When** `POST /api/purchases/:id/receive` is called
  **Then** order status becomes `received`, 2 movement records are created (type `purchase`), product A stock increases by 10, product B stock increases by 5
- **Given** an order with status `pending`
  **When** the receive endpoint is called
  **Then** response is `400` (must be ordered first)
- **Given** the receive operation fails midway (e.g., DB error)
  **When** the transaction rolls back
  **Then** neither the order status nor any stock levels are modified

---

### REQ-4.6: Purchase Order List & Detail

**Description:** `GET /api/purchases` lists orders with filters (`status`, `supplierId`, `dateFrom`, `dateTo`). `GET /api/purchases/:id` returns order with full item details including product names.

**Acceptance Scenarios:**

- **Given** orders exist across multiple statuses
  **When** `GET /api/purchases?status=pending` is called
  **Then** only pending orders are returned
- **Given** a purchase order with 3 items
  **When** `GET /api/purchases/:id` is called
  **Then** response includes order data plus array of items with `product.name`, `quantity`, `unitPrice`, `receivedQuantity`

---

## Phase 5 — Reports

### REQ-5.1: Inventory Value Report

**Description:** `GET /api/reports/inventory-value` calculates total inventory value as `SUM(cost_price * stock)` across all active products. Returns breakdown by category.

**Acceptance Scenarios:**

- **Given** 3 active products: A (cost=10, stock=100), B (cost=20, stock=50), C (cost=5, stock=200)
  **When** `GET /api/reports/inventory-value` is called
  **Then** response is `{ "totalValue": 3000.00, "byCategory": [...] }` where total = (10×100) + (20×50) + (5×200)
- **Given** soft-deleted products exist
  **When** the report is generated
  **Then** soft-deleted products are excluded from the calculation

---

### REQ-5.2: Product Rotation Report

**Description:** `GET /api/reports/product-rotation` returns products ranked by movement volume within a date range (`dateFrom`, `dateTo` required). Shows total quantity moved in and out.

**Acceptance Scenarios:**

- **Given** movements exist for products A, B, C in the specified date range
  **When** `GET /api/reports/product-rotation?dateFrom=2026-01-01&dateTo=2026-06-30` is called
  **Then** products are returned sorted by total movement quantity descending, with `quantityIn` and `quantityOut` per product
- **Given** no date range is provided
  **When** the endpoint is called
  **Then** response is `400` (dateFrom and dateTo are required)

---

### REQ-5.3: Shrinkage Report

**Description:** `GET /api/reports/shrinkage` returns all shrinkage and `adjustment_out` movements within a date range, grouped by product. Shows total quantity lost and estimated value loss (`quantity * cost_price`).

**Acceptance Scenarios:**

- **Given** shrinkage movements exist for products A and B
  **When** `GET /api/reports/shrinkage?dateFrom=2026-01-01&dateTo=2026-06-30` is called
  **Then** response groups shrinkage by product with `totalQuantityLost` and `totalValueLost` per product
- **Given** no shrinkage movements exist in the range
  **When** the endpoint is called
  **Then** an empty result is returned with `totalShrinkage = 0`

---

### REQ-5.4: Movement Summary Report

**Description:** `GET /api/reports/movements-summary` returns aggregated movement counts and quantities grouped by `movement_type` within a date range.

**Acceptance Scenarios:**

- **Given** movements of all 6 types exist in the date range
  **When** `GET /api/reports/movements-summary?dateFrom=2026-01-01&dateTo=2026-06-30` is called
  **Then** response contains 6 entries, one per type, with `count` and `totalQuantity` for each
- **Given** only `purchase` and `sale` movements exist
  **When** the endpoint is called
  **Then** only those 2 types appear in the response (or all 6 with zero counts — implementation choice, but must be consistent)

---

### REQ-5.5: Report Export

**Description:** `GET /api/reports/export/:type` exports a report in the specified format (`csv`, `xlsx`). Supported report types: `inventory-value`, `product-rotation`, `shrinkage`, `movements-summary`. Returns file download with appropriate `Content-Type` and `Content-Disposition` headers.

**Acceptance Scenarios:**

- **Given** valid report type and date range
  **When** `GET /api/reports/export/inventory-value?format=csv&dateFrom=...&dateTo=...` is called
  **Then** response is `200` with `Content-Type: text/csv`, `Content-Disposition: attachment; filename="inventory-value-YYYY-MM-DD.csv"`, and valid CSV body
- **Given** an unsupported format
  **When** the endpoint is called with `format=pdf`
  **Then** response is `400` (only csv and xlsx supported)
- **Given** an unsupported report type
  **When** the endpoint is called with `type=unknown`
  **Then** response is `400`

---

## Phase 6 — Users + Polish

### REQ-6.1: Database Schema — Additional Tables for Images & Uploads

**Description:** Ensure `products.image_url` column exists (already in Phase 2 schema). Create `uploads/` directory configuration. Configure multer for file upload with size limit (5MB default) and allowed types (jpeg, png, webp).

**Acceptance Scenarios:**

- **Given** the uploads directory does not exist
  **When** the server starts
  **Then** the directory is created automatically
- **Given** a file larger than `MAX_FILE_SIZE`
  **When** it is uploaded
  **Then** response is `400` with "File too large"

---

### REQ-6.2: Product Image Upload

**Description:** `POST /api/products/:id/image` accepts a single image file via multipart form. Stores file in `uploads/` directory, updates `products.image_url`. Admin or operator role. Returns the image URL.

**Acceptance Scenarios:**

- **Given** a valid product and a JPEG image under 5MB
  **When** `POST /api/products/:id/image` is called with the file
  **Then** the file is saved, `image_url` is updated, and response is `200` with `{ "imageUrl": "/uploads/<filename>" }`
- **Given** a product that does not exist
  **When** the upload endpoint is called
  **Then** response is `404`
- **Given** a file with extension `.exe`
  **When** it is uploaded
  **Then** response is `400` (invalid file type)

---

### REQ-6.3: Product Image Delete

**Description:** `DELETE /api/products/:id/image` removes the image file from disk and sets `image_url` to NULL. Admin or operator role.

**Acceptance Scenarios:**

- **Given** a product with an uploaded image
  **When** `DELETE /api/products/:id/image` is called
  **Then** the file is deleted from disk, `image_url` becomes NULL, and response is `200`
- **Given** a product without an image
  **When** the endpoint is called
  **Then** response is `404` with "Product has no image"

---

### REQ-6.4: Product CSV Import

**Description:** `POST /api/products/import` accepts a CSV file with columns: `name`, `reference`, `category_name` (creates category if not exists), `description`, `cost_price`, `sale_price`, `min_stock`, `max_stock`. Validates each row. Creates products in bulk within a transaction. Admin only.

**Acceptance Scenarios:**

- **Given** a valid CSV with 10 product rows
  **When** `POST /api/products/import` is called
  **Then** all 10 products are created, referenced categories are created if needed, and response is `200` with `{ "imported": 10, "errors": [] }`
- **Given** a CSV where row 3 has an invalid reference (duplicate)
  **When** the import is processed
  **Then** the entire transaction rolls back (no partial imports) and response is `400` with the error for row 3
- **Given** a non-CSV file is uploaded
  **When** the endpoint is called
  **Then** response is `400` (invalid file type)

---

### REQ-6.5: Product CSV Export

**Description:** `GET /api/products/export` exports all active products as CSV with columns: `id`, `name`, `reference`, `category`, `description`, `cost_price`, `sale_price`, `stock`, `min_stock`, `max_stock`. Returns file download.

**Acceptance Scenarios:**

- **Given** 50 active products exist
  **When** `GET /api/products/export` is called
  **Then** response is a CSV file with 50 data rows plus header, `Content-Type: text/csv`, and `Content-Disposition: attachment`
- **Given** soft-deleted products exist
  **When** the export is generated
  **Then** soft-deleted products are excluded

---

### REQ-6.6: User CRUD — List & Get

**Description:** `GET /api/users` lists all users (with pagination), including their role name. Excludes `password_hash`. `GET /api/users/:id` returns user detail. Admin only.

**Acceptance Scenarios:**

- **Given** multiple users exist
  **When** `GET /api/users` is called by an admin
  **Then** all users are returned with `id`, `email`, `name`, `role.name`, `active`, `created_at` — no password hash
- **Given** a user ID that does not exist
  **When** `GET /api/users/:id` is called
  **Then** response is `404`

---

### REQ-6.7: User CRUD — Create

**Description:** `POST /api/users` creates a new user. Accepts `email`, `password`, `name`, `roleId`. Hashes password with bcrypt/argon2. Validates email uniqueness and password strength (min 8 chars). Admin only.

**Acceptance Scenarios:**

- **Given** valid user data
  **When** `POST /api/users` is called by an admin
  **Then** user is created with hashed password and response is `201` (password not returned)
- **Given** an email that already exists
  **When** the endpoint is called
  **Then** response is `409` (conflict)
- **Given** a password with 5 characters
  **When** the endpoint is called
  **Then** response is `400` with "Password must be at least 8 characters"

---

### REQ-6.8: User CRUD — Update

**Description:** `PUT /api/users/:id` updates `name`, `email`. Validates email uniqueness on change. Admin only.

**Acceptance Scenarios:**

- **Given** a user exists
  **When** `PUT /api/users/:id` is called with `{ "name": "New Name" }`
  **Then** the name is updated and response is `200`
- **Given** the new email is already used by another user
  **When** the endpoint is called
  **Then** response is `409`

---

### REQ-6.9: Role Change

**Description:** `PUT /api/users/:id/role` changes a user's role. Accepts `roleId`. Validates role exists. Admin only. Cannot change own role (prevent lockout).

**Acceptance Scenarios:**

- **Given** a user with role `operador`
  **When** `PUT /api/users/:id/role` is called with `{ "roleId": "<admin-role-id>" }`
  **Then** the user's role is updated and response is `200`
- **Given** an admin attempts to change their own role
  **When** the endpoint is called with their own user ID
  **Then** response is `400` with "Cannot change your own role"
- **Given** a roleId that does not exist
  **When** the endpoint is called
  **Then** response is `400`

---

### REQ-6.10: User Soft Delete (Deactivate)

**Description:** `DELETE /api/users/:id` sets `active = FALSE`. Deactivated users cannot log in. Admin only. Cannot deactivate own account.

**Acceptance Scenarios:**

- **Given** an active user
  **When** `DELETE /api/users/:id` is called by an admin
  **Then** `active` is set to `FALSE` and response is `200`
- **Given** a deactivated user
  **When** they attempt to login
  **Then** response is `401` with "Account is deactivated"
- **Given** an admin attempts to deactivate their own account
  **When** the endpoint is called with their own user ID
  **Then** response is `400` with "Cannot deactivate your own account"

---

### REQ-6.11: Health Check & Readiness

**Description:** `GET /api/health` returns `{ "status": "ok", "timestamp": "...", "uptime": <seconds> }`. `GET /api/health/ready` checks database connectivity and returns 200 if connected, 503 if not.

**Acceptance Scenarios:**

- **Given** the server is running normally
  **When** `GET /api/health` is called
  **Then** response is `200` with status, timestamp, and uptime
- **Given** the database connection is lost
  **When** `GET /api/health/ready` is called
  **Then** response is `503` with `{ "status": "error", "database": "disconnected" }`

---

### REQ-6.12: Graceful Shutdown

**Description:** On SIGTERM/SIGINT, the server stops accepting new connections, waits for in-flight requests to complete (with timeout), closes the database pool, and exits with code 0.

**Acceptance Scenarios:**

- **Given** the server is running with active connections
  **When** SIGTERM is sent
  **Then** the server logs "Shutting down...", waits for requests, closes DB pool, and exits with code 0
- **Given** a request is in-flight during shutdown
  **When** the shutdown timeout (30s) expires
  **Then** the process exits forcefully with code 1

---

## Cross-Cutting Requirements

### REQ-X.1: Clean Architecture Layer Enforcement

**Description:** Domain layer must not import from application, infrastructure, or presentation layers. Application layer imports only from domain. Infrastructure implements domain interfaces. Presentation (controllers) only extracts HTTP params and calls use cases.

**Acceptance Scenarios:**

- **Given** the project structure
  **When** a file in `src/domain/` is analyzed
  **Then** it has zero imports from `src/application/`, `src/infrastructure/`, or `src/presentation/`
- **Given** a controller file
  **When** it is reviewed
  **Then** it contains no business logic — only request extraction, use case invocation, and response formatting

---

### REQ-X.2: Parametrized SQL Only

**Description:** Zero string-concatenated SQL queries. All database queries use `pg` parametrized queries (`$1`, `$2`, ...) or query builders that produce parametrized output.

**Acceptance Scenarios:**

- **Given** all repository implementations
  **When** the codebase is scanned for SQL patterns
  **Then** zero instances of string concatenation or template literal interpolation in SQL strings are found
- **Given** a repository method
  **When** it executes a query
  **Then** all user-supplied values are passed as parameters, not embedded in the SQL string

---

### REQ-X.3: Valibot Validation on All Write Endpoints

**Description:** Every POST, PUT, PATCH endpoint validates its input using Valibot schemas through the `validator` middleware before reaching the controller.

**Acceptance Scenarios:**

- **Given** any POST or PUT route
  **When** the route definition is inspected
  **Then** the `validator(schema)` middleware is present before the controller handler
- **Given** invalid input is sent to a write endpoint
  **When** the request is processed
  **Then** response is `400` with field-level validation errors (no controller logic is executed)

---

### REQ-X.4: Testing Coverage

**Description:** Vitest tests cover: domain entities (business logic), use cases (orchestration), repositories (integration with test DB), controllers (HTTP layer), and middleware (auth, RBAC, validation). Minimum 80% line coverage on domain and application layers.

**Acceptance Scenarios:**

- **Given** the test suite is run
  **When** `bunx vitest run --coverage` executes
  **Then** all tests pass and coverage report shows ≥ 80% line coverage on `src/domain/` and `src/application/`
- **Given** a domain entity with validation logic
  **When** unit tests are written for it
  **Then** both valid and invalid construction scenarios are tested
