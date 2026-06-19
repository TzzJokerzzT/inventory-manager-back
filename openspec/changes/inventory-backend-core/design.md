# Technical Design: Inventory Backend Core

## 1. Project Structure

```
src/
├── domain/
│   ├── entities/
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   ├── InventoryMovement.ts
│   │   ├── PurchaseOrder.ts
│   │   ├── PurchaseOrderItem.ts
│   │   └── Supplier.ts
│   ├── value-objects/
│   │   ├── Email.ts
│   │   ├── Money.ts
│   │   ├── StockLevel.ts
│   │   └── MovementType.ts
│   └── repositories/
│       ├── IUserRepository.ts
│       ├── IProductRepository.ts
│       ├── IMovementRepository.ts
│       ├── IPurchaseOrderRepository.ts
│       └── ISupplierRepository.ts
├── application/
│   ├── ports/
│   │   ├── repositories/           # Re-exports domain interfaces for DI clarity
│   │   │   ├── IUserRepository.ts
│   │   │   ├── IProductRepository.ts
│   │   │   ├── IMovementRepository.ts
│   │   │   ├── IPurchaseOrderRepository.ts
│   │   │   └── ISupplierRepository.ts
│   │   └── services/
│   │       ├── IJwtService.ts
│   │       ├── IPasswordService.ts
│   │       └── IFileStorageService.ts
│   └── use-cases/
│       ├── auth/
│       │   ├── LoginUser.ts
│       │   ├── RefreshToken.ts
│       │   └── LogoutUser.ts
│       ├── products/
│       │   ├── CreateProduct.ts
│       │   ├── GetProduct.ts
│       │   ├── ListProducts.ts
│       │   ├── UpdateProduct.ts
│       │   ├── DeleteProduct.ts
│       │   ├── UploadProductImage.ts
│       │   ├── DeleteProductImage.ts
│       │   ├── ImportProducts.ts
│       │   └── ExportProducts.ts
│       ├── inventory/
│       │   ├── GetProductStock.ts
│       │   ├── UpdateStockLevels.ts
│       │   └── GetLowStockProducts.ts
│       ├── movements/
│       │   ├── RegisterEntry.ts
│       │   ├── RegisterExit.ts
│       │   ├── GetMovement.ts
│       │   └── ListMovements.ts
│       ├── purchases/
│       │   ├── CreatePurchaseOrder.ts
│       │   ├── GetPurchaseOrder.ts
│       │   ├── ListPurchaseOrders.ts
│       │   ├── UpdatePurchaseOrderStatus.ts
│       │   └── ReceivePurchaseOrder.ts
│       ├── suppliers/
│       │   ├── CreateSupplier.ts
│       │   ├── GetSupplier.ts
│       │   ├── ListSuppliers.ts
│       │   └── UpdateSupplier.ts
│       ├── reports/
│       │   ├── GetInventoryValue.ts
│       │   ├── GetProductRotation.ts
│       │   ├── GetShrinkageReport.ts
│       │   ├── GetMovementsSummary.ts
│       │   └── ExportReport.ts
│       └── users/
│           ├── CreateUser.ts
│           ├── GetUser.ts
│           ├── ListUsers.ts
│           ├── UpdateUser.ts
│           ├── UpdateUserRole.ts
│           └── DeactivateUser.ts
├── infrastructure/
│   ├── database/
│   │   ├── postgres/
│   │   │   ├── connection.ts          # Pool factory + graceful shutdown
│   │   │   ├── migrations/
│   │   │   │   ├── 001-roles.up.sql
│   │   │   │   ├── 001-roles.down.sql
│   │   │   │   ├── 002-users.up.sql
│   │   │   │   ├── 002-users.down.sql
│   │   │   │   ├── 003-refresh-tokens.up.sql
│   │   │   │   ├── 003-refresh-tokens.down.sql
│   │   │   │   ├── 004-categories.up.sql
│   │   │   │   ├── 004-categories.down.sql
│   │   │   │   ├── 005-products.up.sql
│   │   │   │   ├── 005-products.down.sql
│   │   │   │   ├── 006-inventory-movements.up.sql
│   │   │   │   ├── 006-inventory-movements.down.sql
│   │   │   │   ├── 007-suppliers.up.sql
│   │   │   │   ├── 007-suppliers.down.sql
│   │   │   │   ├── 008-purchase-orders.up.sql
│   │   │   │   └── 008-purchase-orders.down.sql
│   │   │   └── seeds/
│   │   │       └── seed.ts            # Roles + admin user
│   │   └── repositories/
│   │       ├── PostgresUserRepository.ts
│   │       ├── PostgresProductRepository.ts
│   │       ├── PostgresMovementRepository.ts
│   │       ├── PostgresPurchaseOrderRepository.ts
│   │       └── PostgresSupplierRepository.ts
│   ├── http/
│   │   ├── server.ts                  # Express app factory
│   │   ├── middleware/
│   │   │   ├── cors.ts
│   │   │   ├── helmet.ts
│   │   │   ├── rate-limiter.ts
│   │   │   ├── auth.ts                # JWT verification
│   │   │   ├── rbac.ts                # Role-based access control
│   │   │   ├── validator.ts           # Valibot schema wrapper
│   │   │   ├── error-handler.ts       # Global error handler
│   │   │   └── upload.ts              # Multer config for file uploads
│   │   └── routes/
│   │       ├── index.ts               # Route aggregator
│   │       ├── health.routes.ts
│   │       ├── auth.routes.ts
│   │       ├── products.routes.ts
│   │       ├── movements.routes.ts
│   │       ├── purchases.routes.ts
│   │       ├── suppliers.routes.ts
│   │       ├── reports.routes.ts
│   │       └── users.routes.ts
│   └── services/
│       ├── JwtService.ts
│       ├── PasswordService.ts
│       └── FileStorageService.ts
├── presentation/
│   └── controllers/
│       ├── AuthController.ts
│       ├── ProductController.ts
│       ├── MovementController.ts
│       ├── PurchaseController.ts
│       ├── SupplierController.ts
│       ├── ReportController.ts
│       └── UserController.ts
└── shared/
    ├── types/
    │   ├── express.d.ts               # Express Request augmentation
    │   └── pagination.ts              # PaginatedResult<T> generic
    ├── constants/
    │   ├── roles.ts                   # Role enum: admin, operador, solo_lectura
    │   └── movement-types.ts          # Movement type string constants
    ├── errors/
    │   ├── AppError.ts                # Base error class
    │   ├── NotFoundError.ts
    │   ├── ValidationError.ts
    │   ├── UnauthorizedError.ts
    │   ├── ForbiddenError.ts
    │   └── ConflictError.ts
    └── utils/
        ├── async-handler.ts           # Wraps async fns for Express
        └── pagination.ts              # Offset/limit helpers
```

## 2. Domain Layer

### Entity Design

All entities are pure TypeScript classes with no framework dependencies. They encapsulate business rules and validate invariants at construction or via methods.

```typescript
// domain/entities/User.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly email: Email,
    public readonly name: string,
    public readonly roleId: string,
    public readonly active: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt?: Date,
  ) {}

  canAccess(allowedRoles: string[]): boolean {
    return allowedRoles.includes(this.roleId);
  }

  deactivate(): User {
    if (!this.active) throw new ConflictError("User already deactivated");
    return new User(this.id, this.email, this.name, this.roleId, false, this.createdAt, new Date());
  }
}
```

```typescript
// domain/entities/Product.ts
export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly reference: string,
    public readonly categoryId: string | null,
    public readonly description: string | null,
    public readonly imageUrl: string | null,
    public readonly costPrice: Money,
    public readonly salePrice: Money | null,
    public readonly stock: number,
    public readonly stockLevel: StockLevel,
    public readonly active: boolean,
    public readonly createdById: string,
    public readonly createdAt: Date,
    public readonly updatedAt?: Date,
  ) {}

  isLowStock(): boolean {
    return this.stock <= this.stockLevel.min;
  }

  canSell(quantity: number): boolean {
    return this.stock - quantity >= 0;
  }

  recordEntry(quantity: number): Product {
    if (quantity <= 0) throw new ValidationError("Entry quantity must be positive");
    const newStock = this.stock + quantity;
    if (newStock > this.stockLevel.max) {
      throw new ValidationError(`Stock would exceed maximum of ${this.stockLevel.max}`);
    }
    return new Product(this.id, this.name, this.reference, this.categoryId,
      this.description, this.imageUrl, this.costPrice, this.salePrice,
      newStock, this.stockLevel, this.active, this.createdById,
      this.createdAt, new Date());
  }

  recordExit(quantity: number): Product {
    if (quantity <= 0) throw new ValidationError("Exit quantity must be positive");
    if (!this.canSell(quantity)) {
      throw new ValidationError(`Insufficient stock. Available: ${this.stock}`);
    }
    return new Product(this.id, this.name, this.reference, this.categoryId,
      this.description, this.imageUrl, this.costPrice, this.salePrice,
      this.stock - quantity, this.stockLevel, this.active, this.createdById,
      this.createdAt, new Date());
  }
}
```

```typescript
// domain/entities/InventoryMovement.ts
export class InventoryMovement {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly type: MovementType,
    public readonly quantity: number,
    public readonly reason: string | null,
    public readonly referenceDoc: string | null,
    public readonly createdById: string,
    public readonly createdAt: Date,
  ) {}

  static createEntry(productId: string, quantity: number, type: MovementType, createdById: string, reason?: string, referenceDoc?: string): InventoryMovement {
    if (!MovementType.isEntry(type)) throw new ValidationError(`${type} is not an entry type`);
    return new InventoryMovement(crypto.randomUUID(), productId, type, quantity, reason ?? null, referenceDoc ?? null, createdById, new Date());
  }

  static createExit(productId: string, quantity: number, type: MovementType, createdById: string, reason?: string, referenceDoc?: string): InventoryMovement {
    if (!MovementType.isExit(type)) throw new ValidationError(`${type} is not an exit type`);
    return new InventoryMovement(crypto.randomUUID(), productId, type, quantity, reason ?? null, referenceDoc ?? null, createdById, new Date());
  }
}
```

```typescript
// domain/entities/PurchaseOrder.ts
export class PurchaseOrder {
  constructor(
    public readonly id: string,
    public readonly supplierId: string,
    public readonly status: OrderStatus,
    public readonly items: PurchaseOrderItem[],
    public readonly notes: string | null,
    public readonly total: Money,
    public readonly createdById: string,
    public readonly createdAt: Date,
    public readonly updatedAt?: Date,
  ) {}

  canTransitionTo(newStatus: OrderStatus): boolean {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ["ordered", "cancelled"],
      ordered: ["received", "cancelled"],
      received: [],
      cancelled: [],
    };
    return transitions[this.status]?.includes(newStatus) ?? false;
  }

  transitionTo(newStatus: OrderStatus): PurchaseOrder {
    if (!this.canTransitionTo(newStatus)) {
      throw new ConflictError(`Cannot transition from ${this.status} to ${newStatus}`);
    }
    return new PurchaseOrder(this.id, this.supplierId, newStatus, this.items,
      this.notes, this.total, this.createdById, this.createdAt, new Date());
  }

  calculateTotal(): Money {
    return this.items.reduce((sum, item) => sum.add(item.subtotal()), Money.zero());
  }
}
```

```typescript
// domain/entities/Supplier.ts
export class Supplier {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly contactName: string | null,
    public readonly email: Email | null,
    public readonly phone: string | null,
    public readonly address: string | null,
    public readonly paymentTerms: string | null,
    public readonly notes: string | null,
    public readonly active: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt?: Date,
  ) {}
}
```

### Value Objects

All value objects are immutable and validate on construction.

```typescript
// domain/value-objects/Email.ts
export class Email {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(public readonly value: string) {}

  static create(raw: string): Email {
    const normalized = raw.toLowerCase().trim();
    if (!Email.EMAIL_REGEX.test(normalized)) {
      throw new ValidationError(`Invalid email: ${raw}`);
    }
    return new Email(normalized);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
```

```typescript
// domain/value-objects/Money.ts
export class Money {
  private constructor(public readonly cents: number) {}

  static fromDecimal(amount: number): Money {
    if (amount < 0) throw new ValidationError("Money amount cannot be negative");
    return new Money(Math.round(amount * 100));
  }

  static zero(): Money {
    return new Money(0);
  }

  toDecimal(): number {
    return this.cents / 100;
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  multiply(factor: number): Money {
    if (factor < 0) throw new ValidationError("Multiplication factor must be non-negative");
    return new Money(Math.round(this.cents * factor));
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }
}
```

```typescript
// domain/value-objects/StockLevel.ts
export class StockLevel {
  private constructor(
    public readonly min: number,
    public readonly max: number,
  ) {}

  static create(min: number, max: number): StockLevel {
    if (min < 0) throw new ValidationError("Min stock cannot be negative");
    if (max < min) throw new ValidationError("Max stock must be >= min stock");
    return new StockLevel(min, max);
  }

  static defaults(): StockLevel {
    return new StockLevel(0, 999999);
  }

  isWithin(quantity: number): boolean {
    return quantity >= this.min && quantity <= this.max;
  }
}
```

```typescript
// domain/value-objects/MovementType.ts
export type MovementTypeValue = "purchase" | "return" | "sale" | "shrinkage" | "adjustment_in" | "adjustment_out";

export class MovementType {
  private static readonly ENTRY_TYPES: Set<MovementTypeValue> = new Set(["purchase", "return", "adjustment_in"]);
  private static readonly EXIT_TYPES: Set<MovementTypeValue> = new Set(["sale", "shrinkage", "adjustment_out"]);
  private static readonly ALL = new Set<MovementTypeValue>([...MovementType.ENTRY_TYPES, ...MovementType.EXIT_TYPES]);

  private constructor(public readonly value: MovementTypeValue) {}

  static create(raw: string): MovementType {
    if (!MovementType.ALL.has(raw as MovementTypeValue)) {
      throw new ValidationError(`Invalid movement type: ${raw}`);
    }
    return new MovementType(raw as MovementTypeValue);
  }

  static isEntry(value: MovementTypeValue): boolean {
    return MovementType.ENTRY_TYPES.has(value);
  }

  static isExit(value: MovementTypeValue): boolean {
    return MovementType.EXIT_TYPES.has(value);
  }

  affectsStock(): boolean {
    return true; // All types affect stock
  }

  toString(): string {
    return this.value;
  }
}
```

### Repository Interfaces

Interfaces define the contract. Implementations live in infrastructure.

```typescript
// domain/repositories/IUserRepository.ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findAll(page: number, limit: number): Promise<PaginatedResult<User>>;
  save(user: User): Promise<User>;
  updateRole(userId: string, roleId: string): Promise<User | null>;
  deactivate(userId: string): Promise<User | null>;
}
```

```typescript
// domain/repositories/IProductRepository.ts
export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(filters: ProductFilters, page: number, limit: number): Promise<PaginatedResult<Product>>;
  findByReference(reference: string): Promise<Product | null>;
  save(product: Product): Promise<Product>;
  update(product: Product): Promise<Product | null>;
  softDelete(id: string): Promise<boolean>;
  findLowStock(): Promise<Product[]>;
  updateStock(productId: string, newStock: number, client?: PoolClient): Promise<boolean>;
}
```

```typescript
// domain/repositories/IMovementRepository.ts
export interface IMovementRepository {
  findById(id: string): Promise<InventoryMovement | null>;
  findAll(filters: MovementFilters, page: number, limit: number): Promise<PaginatedResult<InventoryMovement>>;
  save(movement: InventoryMovement, client?: PoolClient): Promise<InventoryMovement>;
  getSummaryByType(startDate: Date, endDate: Date): Promise<MovementSummary[]>;
}
```

```typescript
// domain/repositories/IPurchaseOrderRepository.ts
export interface IPurchaseOrderRepository {
  findById(id: string): Promise<PurchaseOrder | null>;
  findAll(filters: PurchaseOrderFilters, page: number, limit: number): Promise<PaginatedResult<PurchaseOrder>>;
  save(order: PurchaseOrder, items: PurchaseOrderItem[]): Promise<PurchaseOrder>;
  updateStatus(id: string, status: OrderStatus): Promise<PurchaseOrder | null>;
}
```

```typescript
// domain/repositories/ISupplierRepository.ts
export interface ISupplierRepository {
  findById(id: string): Promise<Supplier | null>;
  findAll(page: number, limit: number): Promise<PaginatedResult<Supplier>>;
  save(supplier: Supplier): Promise<Supplier>;
  update(supplier: Supplier): Promise<Supplier | null>;
}
```

## 3. Application Layer

### Use Case Pattern

Each use case is a single class with one public method (`execute`). Dependencies are injected via constructor.

```typescript
// application/use-cases/products/CreateProduct.ts
export class CreateProduct {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const creator = await this.userRepository.findById(input.createdById);
    if (!creator) throw new UnauthorizedError("Creator not found");

    const existing = await this.productRepository.findByReference(input.reference);
    if (existing) throw new ConflictError(`Product with reference '${input.reference}' already exists`);

    const stockLevel = StockLevel.create(input.minStock, input.maxStock);
    const costPrice = Money.fromDecimal(input.costPrice);
    const salePrice = input.salePrice != null ? Money.fromDecimal(input.salePrice) : null;

    const product = new Product(
      crypto.randomUUID(), input.name, input.reference,
      input.categoryId ?? null, input.description ?? null, null,
      costPrice, salePrice, 0, stockLevel, true,
      input.createdById, new Date(),
    );

    return this.productRepository.save(product);
  }
}
```

### Port Interfaces (Application Layer)

The `application/ports/` directory re-exports domain repository interfaces and defines service ports that infrastructure implements:

```typescript
// application/ports/services/IJwtService.ts
export interface IJwtService {
  generateAccessToken(payload: JwtPayload): string;
  generateRefreshToken(payload: JwtPayload): string;
  verifyAccessToken(token: string): JwtPayload;
  verifyRefreshToken(token: string): JwtPayload;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}
```

```typescript
// application/ports/services/IPasswordService.ts
export interface IPasswordService {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}
```

```typescript
// application/ports/services/IFileStorageService.ts
export interface IFileStorageService {
  save(file: Express.Multer.File, destination: string): Promise<string>;
  delete(filePath: string): Promise<void>;
}
```

## 4. Infrastructure Layer

### Express Server Setup

```typescript
// infrastructure/http/server.ts
export function createApp(deps: AppDependencies): Express.Application {
  const app = express();

  // Trust proxy (for rate limiting behind reverse proxy)
  app.set("trust proxy", 1);

  // Global middleware (order matters)
  app.use(createCorsMiddleware());
  app.use(createHelmetMiddleware());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan("combined"));

  // Health check (before rate limiter)
  app.use("/api/health", healthRouter);

  // Rate limiter for all API routes
  app.use("/api", createApiLimiter());

  // Routes with their own rate limiters + middleware
  app.use("/api/auth", createAuthRateLimiter(), authRouter(deps));
  app.use("/api/products", productsRouter(deps));
  app.use("/api/movements", movementsRouter(deps));
  app.use("/api/purchases", purchasesRouter(deps));
  app.use("/api/suppliers", suppliersRouter(deps));
  app.use("/api/reports", reportsRouter(deps));
  app.use("/api/users", usersRouter(deps));

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: "NOT_FOUND", message: "Route not found" });
  });

  // Global error handler (must be last)
  app.use(createErrorHandler());

  return app;
}
```

### Middleware Chain Order

```
1. CORS (origin validation, credentials)
2. Helmet (security headers)
3. Body parsing (express.json, express.urlencoded)
4. Cookie parser (for refresh token extraction)
5. Morgan (request logging)
6. Rate limiter (per-route or global)
7. Auth middleware (JWT verification — skips public routes)
8. RBAC middleware (role check — skips public routes)
9. Validator middleware (Valibot schema — per-route)
10. Controller (thin handler)
11. Error handler (global catch-all)
```

### PostgreSQL Repository Implementation Pattern

```typescript
// infrastructure/database/repositories/PostgresProductRepository.ts
export class PostgresProductRepository implements IProductRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<Product | null> {
    const result = await this.pool.query(
      `SELECT id, name, reference, category_id, description, image_url,
              cost_price, sale_price, stock, min_stock, max_stock,
              active, created_by, created_at, updated_at
       FROM products WHERE id = $1 AND active = TRUE`,
      [id],
    );
    const row = result.rows[0];
    if (!row) return null;
    return this.toEntity(row);
  }

  async findAll(filters: ProductFilters, page: number, limit: number): Promise<PaginatedResult<Product>> {
    const offset = (page - 1) * limit;
    const conditions: string[] = ["active = TRUE"];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.search) {
      conditions.push(`(name ILIKE $${paramIndex} OR reference ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }
    if (filters.categoryId) {
      conditions.push(`category_id = $${paramIndex}`);
      params.push(filters.categoryId);
      paramIndex++;
    }

    const whereClause = conditions.join(" AND ");

    const [countResult, dataResult] = await Promise.all([
      this.pool.query(`SELECT COUNT(*) FROM products WHERE ${whereClause}`, params),
      this.pool.query(
        `SELECT * FROM products WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset],
      ),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    const products = dataResult.rows.map((row) => this.toEntity(row));

    return { data: products, total, page, limit };
  }

  // ... other methods follow same pattern: parametrized queries, row mappers
}
```

### JWT Service

```typescript
// infrastructure/services/JwtService.ts
export class JwtService implements IJwtService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiration: string;
  private readonly refreshExpiration: string;

  constructor(config: JwtConfig) {
    this.accessSecret = config.accessSecret;
    this.refreshSecret = config.refreshSecret;
    this.accessExpiration = config.accessExpiration;
    this.refreshExpiration = config.refreshExpiration;
  }

  generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.accessSecret, { expiresIn: this.accessExpiration });
  }

  generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign({ userId: payload.userId }, this.refreshSecret, { expiresIn: this.refreshExpiration });
  }

  verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, this.accessSecret) as JwtPayload;
  }

  verifyRefreshToken(token: string): JwtPayload {
    const decoded = jwt.verify(token, this.refreshSecret) as { userId: string };
    return { userId: decoded.userId, email: "", role: "" };
  }
}
```

### Password Service

```typescript
// infrastructure/services/PasswordService.ts
export class PasswordService implements IPasswordService {
  private readonly saltRounds = 12;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

### File Upload with Multer

```typescript
// infrastructure/http/middleware/upload.ts
export function createUploadMiddleware(): multer.Multer {
  return multer({
    storage: multer.diskStorage({
      destination: process.env.UPLOAD_DIR ?? "./uploads",
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${crypto.randomUUID()}${ext}`);
      },
    }),
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE ?? "5242880", 10), // 5MB
    },
    fileFilter: (_req, file, cb) => {
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new ValidationError("Only JPEG, PNG, and WebP images are allowed"));
      }
    },
  });
}
```

## 5. Presentation Layer

### Controller Pattern

Controllers are thin: extract request data, call use case, format response.

```typescript
// presentation/controllers/ProductController.ts
export class ProductController {
  constructor(
    private readonly createProduct: CreateProduct,
    private readonly getProduct: GetProduct,
    private readonly listProducts: ListProducts,
    private readonly updateProduct: UpdateProduct,
    private readonly deleteProduct: DeleteProduct,
  ) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await this.createProduct.execute({
        ...req.body,
        createdById: req.user!.userId,
      });
      res.status(201).json({ data: this.toDto(product) });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await this.getProduct.execute(req.params.id);
      if (!product) throw new NotFoundError("Product not found");
      res.json({ data: this.toDto(product) });
    } catch (error) {
      next(error);
    }
  }

  // ... other handlers

  private toDto(product: Product): ProductDto {
    return {
      id: product.id,
      name: product.name,
      reference: product.reference,
      costPrice: product.costPrice.toDecimal(),
      salePrice: product.salePrice?.toDecimal() ?? null,
      stock: product.stock,
      minStock: product.stockLevel.min,
      maxStock: product.stockLevel.max,
      isLowStock: product.isLowStock(),
      imageUrl: product.imageUrl,
      createdAt: product.createdAt,
    };
  }
}
```

### Request/Response DTOs

DTOs live alongside controllers or in a `dtos/` subfolder. They are plain interfaces/types:

```typescript
// presentation/controllers/dtos/ProductDto.ts
export interface ProductDto {
  id: string;
  name: string;
  reference: string;
  costPrice: number;
  salePrice: number | null;
  stock: number;
  minStock: number;
  maxStock: number;
  isLowStock: boolean;
  imageUrl: string | null;
  createdAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

### Route Wiring

```typescript
// infrastructure/http/routes/products.routes.ts
export function productsRouter(deps: AppDependencies): Router {
  const router = Router();

  const controller = new ProductController(
    new CreateProduct(deps.productRepository, deps.userRepository),
    new GetProduct(deps.productRepository),
    new ListProducts(deps.productRepository),
    new UpdateProduct(deps.productRepository),
    new DeleteProduct(deps.productRepository),
  );

  const upload = createUploadMiddleware();

  router.get("/", validate(ListProductsQuerySchema), asyncHandler(controller.list.bind(controller)));
  router.get("/:id", asyncHandler(controller.getById.bind(controller)));
  router.post("/", auth, rbac(["admin", "operador"]), validate(CreateProductSchema), asyncHandler(controller.create.bind(controller)));
  router.put("/:id", auth, rbac(["admin", "operador"]), validate(UpdateProductSchema), asyncHandler(controller.update.bind(controller)));
  router.delete("/:id", auth, rbac(["admin"]), asyncHandler(controller.delete.bind(controller)));
  router.post("/:id/image", auth, rbac(["admin", "operador"]), upload.single("image"), asyncHandler(controller.uploadImage.bind(controller)));
  router.delete("/:id/image", auth, rbac(["admin", "operador"]), asyncHandler(controller.deleteImage.bind(controller)));
  router.post("/import", auth, rbac(["admin"]), createImportLimiter(), upload.single("file"), asyncHandler(controller.import.bind(controller)));
  router.get("/export", auth, asyncHandler(controller.export.bind(controller)));
  router.get("/low-stock", asyncHandler(controller.getLowStock.bind(controller)));

  return router;
}
```

## 6. Database

### Migration Strategy

Sequential SQL files with `UP` and `DOWN` scripts, numbered for ordering:

```
migrations/
├── 001-roles.up.sql
├── 001-roles.down.sql
├── 002-users.up.sql
├── 002-users.down.sql
├── 003-refresh-tokens.up.sql
├── 003-refresh-tokens.down.sql
├── 004-categories.up.sql
├── 004-categories.down.sql
├── 005-products.up.sql
├── 005-products.down.sql
├── 006-inventory-movements.up.sql
├── 006-inventory-movements.down.sql
├── 007-suppliers.up.sql
├── 007-suppliers.down.sql
├── 008-purchase-orders.up.sql
└── 008-purchase-orders.down.sql
```

Migration runner (simple script using `pg`):

```typescript
// infrastructure/database/postgres/migrate.ts
const migrationsDir = path.join(__dirname, "migrations");

async function runMigrations(pool: Pool) {
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".up.sql")).sort();

  for (const file of files) {
    const migrationName = file.replace(".up.sql", "");
    const alreadyRun = await pool.query("SELECT 1 FROM schema_migrations WHERE name = $1", [migrationName]);
    if (alreadyRun.rowCount! > 0) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    await pool.query("BEGIN");
    try {
      await pool.query(sql);
      await pool.query("INSERT INTO schema_migrations (name) VALUES ($1)", [migrationName]);
      await pool.query("COMMIT");
      console.log(`Applied: ${migrationName}`);
    } catch (err) {
      await pool.query("ROLLBACK");
      throw err;
    }
  }
}
```

### Pool Configuration

```typescript
// infrastructure/database/postgres/connection.ts
export function createPool(): Pool {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on("error", (err) => {
    console.error("Unexpected pool error", err);
  });

  return pool;
}

export async function closePool(pool: Pool): Promise<void> {
  await pool.end();
}
```

### Parametrized Query Pattern

All queries use `$1, $2, ...` placeholders. No string concatenation for values. Dynamic WHERE clauses are built with arrays:

```typescript
// Safe dynamic WHERE clause
const conditions: string[] = ["active = TRUE"];
const params: unknown[] = [];
let idx = 1;

if (filters.search) {
  conditions.push(`name ILIKE $${idx}`);
  params.push(`%${filters.search}%`);
  idx++;
}

const where = conditions.join(" AND ");
await pool.query(`SELECT * FROM products WHERE ${where}`, params);
```

## 7. Auth Flow

### JWT Access + Refresh Token Rotation

1. **Login**: `POST /api/auth/login` → validates credentials → generates access token (15 min) + refresh token (7 days) → returns access token in body, sets refresh token in httpOnly cookie.
2. **Access**: Client sends `Authorization: Bearer <access_token>` on each request.
3. **Refresh**: `POST /api/auth/refresh` → reads refresh token from cookie → verifies → checks DB for revocation → generates new access + refresh tokens → sets new refresh cookie → returns new access token.
4. **Logout**: `POST /api/auth/logout` → revokes current refresh token in DB → clears cookie.

### Cookie Configuration

```typescript
const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/api/auth",
};
```

### Auth Middleware

```typescript
// infrastructure/http/middleware/auth.ts
export function auth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("No access token provided"));
  }

  try {
    const token = header.slice(7);
    const payload = jwtService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired access token"));
  }
}
```

### RBAC Middleware

```typescript
// infrastructure/http/middleware/rbac.ts
export function rbac(allowedRoles: string[]): RequestHandler {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError("Not authenticated"));
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError("Insufficient permissions"));
    }
    next();
  };
}
```

### Rate Limiter Configuration

```typescript
// infrastructure/http/middleware/rate-limiter.ts
export function createPublicLimiter(): RateLimit {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: "RATE_LIMITED", message: "Too many requests. Try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

export function createAuthLimiter(): RateLimit {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: "RATE_LIMITED", message: "Too many requests." },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

export function createImportLimiter(): RateLimit {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "RATE_LIMITED", message: "Import limit reached." },
    standardHeaders: true,
    legacyHeaders: false,
  });
}
```

### Refresh Token Storage

Refresh tokens are stored hashed in the `refresh_tokens` table:

```typescript
// On login:
const tokenHash = await bcrypt.hash(refreshToken, 10);
await pool.query(
  "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
  [userId, tokenHash, expiresAt],
);

// On refresh:
const stored = await pool.query("SELECT * FROM refresh_tokens WHERE user_id = $1 AND revoked = FALSE", [userId]);
const isValid = await bcrypt.compare(refreshToken, stored.rows[0].token_hash);
if (!isValid) throw new UnauthorizedError("Invalid refresh token");

// Rotation: revoke old, insert new
await pool.query("UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1", [stored.rows[0].id]);
```

## 8. Error Handling

### Domain Error Hierarchy

```typescript
// shared/errors/AppError.ts
export abstract class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// shared/errors/NotFoundError.ts
export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

// shared/errors/ValidationError.ts
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

// shared/errors/UnauthorizedError.ts
export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

// shared/errors/ForbiddenError.ts
export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

// shared/errors/ConflictError.ts
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}
```

### Global Error Handler

```typescript
// infrastructure/http/middleware/error-handler.ts
export function createErrorHandler(): ErrorRequestHandler {
  return (err: Error, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        error: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      });
    }

    // Unexpected errors
    console.error("Unhandled error:", err);

    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  };
}
```

### Error → HTTP Status Mapping

| Domain Error | HTTP Status | Code |
|---|---|---|
| `NotFoundError` | 404 | `NOT_FOUND` |
| `ValidationError` | 400 | `VALIDATION_ERROR` |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` |
| `ForbiddenError` | 403 | `FORBIDDEN` |
| `ConflictError` | 409 | `CONFLICT` |
| Unhandled `Error` | 500 | `INTERNAL_ERROR` |

### Valibot Validation Middleware

```typescript
// infrastructure/http/middleware/validator.ts
export function validate<T extends GenericSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = safeParse(schema, req.body);
    if (!result.success) {
      const issues = result.issues.map((issue) => ({
        field: issue.path?.map((p) => p.key).join(".") ?? "unknown",
        message: issue.message,
      }));
      return next(new ValidationError("Validation failed", issues));
    }
    req.body = result.output;
    next();
  };
}
```

## 9. Testing Strategy

### Unit Tests — Domain Entities

Test entity invariants, state transitions, and value object validation in isolation.

```typescript
// tests/unit/domain/entities/Product.test.ts
import { describe, it, expect } from "vitest";
import { Product } from "../../../../src/domain/entities/Product";
import { Money } from "../../../../src/domain/value-objects/Money";
import { StockLevel } from "../../../../src/domain/value-objects/StockLevel";
import { ValidationError } from "../../../../src/shared/errors/ValidationError";

describe("Product", () => {
  const makeProduct = (stock = 10) => new Product(
    "uuid-1", "Widget", "WGT-001", null, null, null,
    Money.fromDecimal(10.00), Money.fromDecimal(15.00),
    stock, StockLevel.create(5, 100), true, "user-1", new Date(),
  );

  it("should detect low stock", () => {
    const product = makeProduct(3);
    expect(product.isLowStock()).toBe(true);
  });

  it("should reject exit when insufficient stock", () => {
    const product = makeProduct(2);
    expect(() => product.recordExit(5)).toThrow(ValidationError);
  });

  it("should reject entry exceeding max stock", () => {
    const product = makeProduct(95);
    expect(() => product.recordEntry(10)).toThrow(ValidationError);
  });

  it("should record valid entry", () => {
    const product = makeProduct(10);
    const updated = product.recordEntry(5);
    expect(updated.stock).toBe(15);
    expect(product.stock).toBe(10); // immutable
  });
});
```

### Integration Tests — Repositories

Test against a real test database using `testcontainers` or a dedicated test DB.

```typescript
// tests/integration/repositories/PostgresProductRepository.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";
import { PostgresProductRepository } from "../../../src/infrastructure/database/repositories/PostgresProductRepository";

describe("PostgresProductRepository", () => {
  let pool: Pool;
  let repo: PostgresProductRepository;

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    repo = new PostgresProductRepository(pool);
    await pool.query("DELETE FROM products");
  });

  afterAll(async () => {
    await pool.end();
  });

  it("should save and find a product", async () => {
    const product = new Product(/* ... */);
    const saved = await repo.save(product);
    const found = await repo.findById(saved.id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe(product.name);
  });

  it("should return null for non-existent product", async () => {
    const found = await repo.findById("non-existent");
    expect(found).toBeNull();
  });

  it("should filter products by search term", async () => {
    // Seed products, then test ILIKE search
  });
});
```

### E2E Tests — Endpoints

Test full request/response cycle with Supertest.

```typescript
// tests/e2e/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../src/infrastructure/http/server";
import { createPool } from "../../src/infrastructure/database/postgres/connection";

describe("POST /api/auth/login", () => {
  let app: Express.Application;
  let pool: Pool;

  beforeAll(async () => {
    pool = createPool();
    const deps = buildTestDependencies(pool);
    app = createApp(deps);
  });

  afterAll(async () => {
    await pool.end();
  });

  it("should return access token and set refresh cookie", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@test.com", password: "admin123" })
      .expect(200);

    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("should reject invalid credentials", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@test.com", password: "wrong" })
      .expect(401);
  });
});
```

### Test File Organization

```
tests/
├── unit/
│   ├── domain/
│   │   ├── entities/
│   │   └── value-objects/
│   └── application/
│       └── use-cases/
├── integration/
│   └── repositories/
├── e2e/
│   ├── auth.test.ts
│   ├── products.test.ts
│   └── movements.test.ts
└── helpers/
    ├── test-pool.ts
    ├── seed-data.ts
    └── auth-helpers.ts
```

## 10. Dependency Injection

### Manual Wiring via AppDependencies Interface

No DI container framework. Dependencies are wired manually in a composition root at startup. This keeps the codebase simple and testable.

```typescript
// infrastructure/dependencies.ts
export interface AppDependencies {
  // Repositories
  userRepository: IUserRepository;
  productRepository: IProductRepository;
  movementRepository: IMovementRepository;
  purchaseOrderRepository: IPurchaseOrderRepository;
  supplierRepository: ISupplierRepository;

  // Services
  jwtService: IJwtService;
  passwordService: IPasswordService;
  fileStorageService: IFileStorageService;
}

export function buildDependencies(pool: Pool): AppDependencies {
  // Services (singletons)
  const jwtService = new JwtService({
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION ?? "15m",
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION ?? "7d",
  });

  const passwordService = new PasswordService();
  const fileStorageService = new FileStorageService(process.env.UPLOAD_DIR ?? "./uploads");

  // Repositories (singletons wrapping the pool)
  const userRepository = new PostgresUserRepository(pool);
  const productRepository = new PostgresProductRepository(pool);
  const movementRepository = new PostgresMovementRepository(pool);
  const purchaseOrderRepository = new PostgresPurchaseOrderRepository(pool);
  const supplierRepository = new PostgresSupplierRepository(pool);

  return {
    userRepository,
    productRepository,
    movementRepository,
    purchaseOrderRepository,
    supplierRepository,
    jwtService,
    passwordService,
    fileStorageService,
  };
}
```

### Composition Root

```typescript
// src/index.ts
import { createPool } from "./infrastructure/database/postgres/connection";
import { buildDependencies } from "./infrastructure/dependencies";
import { createApp } from "./infrastructure/http/server";

const pool = createPool();
const deps = buildDependencies(pool);
const app = createApp(deps);

const PORT = parseInt(process.env.PORT ?? "4000", 10);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down...");
  await closePool(pool);
  process.exit(0);
});
```

### Test Dependency Injection

For tests, dependencies are swapped with test-specific implementations:

```typescript
// tests/helpers/test-dependencies.ts
export function buildTestDependencies(pool: Pool): AppDependencies {
  return buildDependencies(pool); // Same function, test DB pool
}

// For unit tests, use mock repositories:
export function buildMockDependencies(): AppDependencies {
  return {
    userRepository: new MockUserRepository(),
    productRepository: new MockProductRepository(),
    movementRepository: new MockMovementRepository(),
    purchaseOrderRepository: new MockPurchaseOrderRepository(),
    supplierRepository: new MockSupplierRepository(),
    jwtService: new MockJwtService(),
    passwordService: new MockPasswordService(),
    fileStorageService: new MockFileStorageService(),
  };
}
```

## Key Design Decisions Summary

| Decision | Choice | Rationale |
|---|---|---|
| DI approach | Manual composition root | No framework overhead, explicit dependencies, easy to mock |
| Validation layer | Valibot middleware | Type inference, runs before controller, rejects early |
| Soft delete | `active` flag + repository filter | Centralized in repo layer, prevents data leaks |
| Stock mutations | DB transactions via PoolClient | Prevents race conditions on concurrent movements |
| Refresh tokens | Hashed in DB + rotation | Detects token theft, immediate revocation |
| Error mapping | Domain errors → HTTP codes | Clean separation, no HTTP leakage in domain |
| Migration runner | Custom pg-based script | No external dependency, simple sequential execution |
| File uploads | Multer → disk storage | Phase 6; can migrate to S3 later via IFileStorageService |
| Test strategy | Vitest + unit/integration/E2E | Fast unit tests, real DB for integration, Supertest for E2E |
