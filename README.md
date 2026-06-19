# 📦 Inventory Manager — Backend API

API REST para el sistema de gestión de inventarios. Autenticación JWT con refresh tokens (httpOnly cookies), RBAC, rate limiting y seguridad hardening.

---

## 🧱 Arquitectura

**Clean Architecture** con principios **SOLID** aplicados a Node.js/Express.

```
src/
├── application/              # Casos de uso
│   ├── use-cases/
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── movements/
│   │   ├── purchases/
│   │   ├── reports/
│   │   └── auth/
│   └── ports/                # Interfaces (repositorios, servicios)
│       ├── repositories/
│       └── services/
├── domain/                   # Entidades y reglas de negocio puras
│   ├── entities/
│   │   ├── Product.ts
│   │   ├── InventoryMovement.ts
│   │   ├── PurchaseOrder.ts
│   │   ├── Supplier.ts
│   │   └── User.ts
│   ├── value-objects/
│   │   ├── Email.ts
│   │   ├── Money.ts
│   │   ├── StockLevel.ts
│   │   └── MovementType.ts
│   └── repositories/         # Contratos (interfaces puras)
│       ├── IProductRepository.ts
│       ├── IMovementRepository.ts
│       ├── IPurchaseRepository.ts
│       ├── ISupplierRepository.ts
│       └── IUserRepository.ts
├── infrastructure/           # Implementaciones concretas
│   ├── database/
│   │   ├── postgres/
│   │   │   ├── connection.ts
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   └── repositories/    # Implementaciones PostgreSQL
│   ├── http/
│   │   ├── server.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT verification
│   │   │   ├── rbac.ts           # Role-based access
│   │   │   ├── rate-limiter.ts
│   │   │   ├── validator.ts      # Valibot schema validation
│   │   │   ├── error-handler.ts
│   │   │   └── cors.ts
│   │   └── routes/
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
├── presentation/             # Controladores (thin layer)
│   └── controllers/
│       ├── AuthController.ts
│       ├── ProductController.ts
│       ├── MovementController.ts
│       ├── PurchaseController.ts
│       ├── SupplierController.ts
│       ├── ReportController.ts
│       └── UserController.ts
└── shared/                   # Tipos, constantes, utilidades
    ├── types/
    ├── constants/
    ├── errors/               # Errores de dominio personalizados
    └── utils/
```

### Flujo de una request

```
Request → Middleware (CORS, Helmet, Rate Limiter, Auth, RBAC, Validator)
        → Controller (extrae params, llama al use case)
        → Use Case (orquesta la lógica de negocio usando repositorios)
        → Repository (implementación PostgreSQL, queries parametrizadas)
        → Response (sin leaks de implementación)
```

- **Domain**: Entidades y value objects puros. No conoce Express ni PostgreSQL.
- **Application**: Casos de uso que orquestan entidades a través de puertos (interfaces).
- **Infrastructure**: Express, pg (driver PostgreSQL), JWT, bcrypt, Helmet. Implementa los contratos.
- **Presentation**: Controladores finos que traducen HTTP ↔ dominio.

---

## 🛠️ Stack Técnico

| Categoría | Tecnología | Propósito |
|-----------|-----------|-----------|
| **Runtime** | Node.js ≥ 20 | Entorno de ejecución |
| **Framework** | Express | HTTP server y routing |
| **Lenguaje** | TypeScript (strict) | Tipado estático |
| **Base de datos** | PostgreSQL ≥ 15 | Almacenamiento relacional |
| **Driver DB** | pg (node-postgres) | Conexión nativa a PostgreSQL |
| **Validación** | Valibot | Schemas con inferencia de tipos |
| **Autenticación** | JWT (access + refresh tokens) | Stateless auth |
| **Cookies** | httpOnly, Secure, SameSite=Strict | Almacenamiento seguro de refresh token |
| **Autorización** | RBAC (admin, operador, solo lectura) | Control de acceso por rol |
| **Rate Limiting** | express-rate-limit | Protección contra abuso |
| **Seguridad HTTP** | Helmet.js | Headers de seguridad (CSP, HSTS, etc.) |
| **CORS** | cors | Whitelist de orígenes |
| **Logging** | Morgan | HTTP request logging |
| **Hashing** | bcrypt / argon2 | Hash de contraseñas |
| **File Upload** | multer | Subida de imágenes de productos |
| **Testing** | Vitest | Tests unitarios e integración |
| Linter | Biome | Linter y formateador |

---

## 🚀 Endpoints

### 🔐 Auth

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| `POST` | `/api/auth/login` | Público | Login → access token en body, refresh token en cookie httpOnly |
| `POST` | `/api/auth/refresh` | Público | Rotar refresh token → nuevo access token |
| `POST` | `/api/auth/logout` | Autenticado | Invalidar refresh token |

**Flujo de auth:**

1. Cliente hace `POST /api/auth/login` con email + password.
2. Servidor valida credenciales, genera access token (15 min) y refresh token (7 días).
3. Access token se devuelve en el body. Refresh token se setea en cookie `httpOnly`, `Secure`, `SameSite=Strict`.
4. Cliente envía access token en header `Authorization: Bearer <token>` en cada request.
5. Cuando expira, cliente llama `POST /api/auth/refresh` (la cookie viaja automáticamente).
6. Servidor rota ambos tokens.

### 📋 Productos

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| `GET` | `/api/products` | Todos | Listar con paginación, búsqueda y filtros |
| `GET` | `/api/products/:id` | Todos | Obtener detalle |
| `POST` | `/api/products` | Admin, Operador | Crear producto |
| `PUT` | `/api/products/:id` | Admin, Operador | Actualizar producto |
| `DELETE` | `/api/products/:id` | Admin | Eliminar producto (soft delete) |
| `POST` | `/api/products/:id/image` | Admin, Operador | Subir imagen del producto |
| `DELETE` | `/api/products/:id/image` | Admin, Operador | Eliminar imagen |
| `POST` | `/api/products/import` | Admin | Importar CSV/Excel |
| `GET` | `/api/products/export` | Todos | Exportar CSV/Excel |

### 📊 Stock

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| `GET` | `/api/products/:id/stock` | Todos | Consultar stock actual |
| `PUT` | `/api/products/:id/stock/levels` | Admin, Operador | Configurar niveles min/max |
| `GET` | `/api/products/low-stock` | Todos | Productos bajo stock mínimo |

### 🔄 Movimientos

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| `GET` | `/api/movements` | Todos | Historial con filtros (tipo, fecha, producto, usuario) |
| `GET` | `/api/movements/:id` | Todos | Detalle de movimiento |
| `POST` | `/api/movements/entry` | Admin, Operador | Registrar entrada (compra, devolución, ajuste) |
| `POST` | `/api/movements/exit` | Admin, Operador | Registrar salida (venta, merma, ajuste) |

**Tipos de movimiento:**

- `purchase` — Entrada por compra
- `return` — Entrada por devolución
- `sale` — Salida por venta
- `shrinkage` — Salida por merma
- `adjustment_in` — Ajuste positivo
- `adjustment_out` — Ajuste negativo

### 🛒 Compras y Proveedores

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| `GET` | `/api/suppliers` | Todos | Catálogo de proveedores |
| `GET` | `/api/suppliers/:id` | Todos | Detalle de proveedor |
| `POST` | `/api/suppliers` | Admin | Registrar proveedor |
| `PUT` | `/api/suppliers/:id` | Admin | Actualizar proveedor |
| `GET` | `/api/purchases` | Todos | Órdenes de compra (con filtros) |
| `GET` | `/api/purchases/:id` | Todos | Detalle de orden |
| `POST` | `/api/purchases` | Admin | Crear orden de compra |
| `PUT` | `/api/purchases/:id/status` | Admin | Cambiar estado (pending → ordered → received → cancelled) |
| `POST` | `/api/purchases/:id/receive` | Admin, Operador | Recepción de mercancía (crea movimiento de entrada) |

### 📈 Reportes

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| `GET` | `/api/reports/inventory-value` | Todos | Valor total del inventario (costo × cantidad) |
| `GET` | `/api/reports/product-rotation` | Todos | Productos más y menos rotados en un período |
| `GET` | `/api/reports/shrinkage` | Todos | Reporte de mermas y ajustes |
| `GET` | `/api/reports/movements-summary` | Todos | Resumen de movimientos por tipo y período |
| `GET` | `/api/reports/export/:type` | Todos | Exportar reporte (csv, xlsx, pdf) |

### 👥 Usuarios

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| `GET` | `/api/users` | Admin | Listar usuarios |
| `GET` | `/api/users/:id` | Admin | Detalle de usuario |
| `POST` | `/api/users` | Admin | Crear usuario |
| `PUT` | `/api/users/:id` | Admin | Actualizar usuario |
| `PUT` | `/api/users/:id/role` | Admin | Cambiar rol |
| `DELETE` | `/api/users/:id` | Admin | Desactivar usuario (soft delete) |

---

## 🔐 Seguridad

### Autenticación

- **Access token**: JWT firmado con `JWT_ACCESS_SECRET`, expira en 15 minutos. Se envía en header `Authorization: Bearer <token>`.
- **Refresh token**: JWT firmado con `JWT_REFRESH_SECRET`, expira en 7 días. Se almacena en cookie `httpOnly`, `Secure`, `SameSite=Strict`. **Nunca** en localStorage.
- **Rotación**: Al usar el refresh token, se emite uno nuevo y se invalida el anterior (refresh token rotation).

### Autorización (RBAC)

Middleware que verifica el rol del usuario contra los roles permitidos para cada endpoint:

```typescript
// Ejemplo: solo admin y operador pueden crear productos
router.post('/products', auth, rbac(['admin', 'operador']), createProduct);
```

| Rol | Permisos |
|-----|----------|
| **admin** | CRUD completo en todos los recursos, gestión de usuarios |
| **operador** | CRUD productos, registrar movimientos, recepción de compras, ver reportes |
| **solo_lectura** | Solo GET en todos los endpoints |

### Rate Limiting

| Grupo | Límite | Ventana |
|-------|--------|---------|
| Endpoints públicos (login, refresh) | 20 req | 15 min |
| Endpoints autenticados | 1000 req | 15 min |
| Endpoints de importación | 10 req | 15 min |

### Headers de seguridad (Helmet.js)

```typescript
helmet({
  contentSecurityPolicy: true,   // CSP configurado
  hsts: true,                    // Strict-Transport-Security
  xFrameOptions: 'DENY',         // Anti clickjacking
  xContentTypeOptions: true,     // No MIME sniffing
  referrerPolicy: 'same-origin',
});
```

### Validación de entrada

Todo input se valida con schemas **Valibot** antes de llegar al controller. El middleware `validator` recibe el schema y rechaza requests inválidas con 400.

```typescript
// Ejemplo de schema para crear producto
const CreateProductSchema = object({
  name: pipe(string(), minLength(1), maxLength(200)),
  reference: pipe(string(), minLength(1), maxLength(100)),
  categoryId: pipe(string(), uuid()),
  description: optional(pipe(string(), maxLength(2000))),
  minStock: pipe(number(), minValue(0)),
  maxStock: pipe(number(), minValue(1)),
});
```

### Prevención de inyecciones

- **SQL**: Queries parametrizadas con `pg` (nunca concatenación de strings).
- **XSS**: Helmet CSP + sanitización de texto libre.
- **CSRF**: SameSite=Strict en cookies + verificación del header `Origin`.

### Manejo de errores

El error handler global captura todas las excepciones y devuelve respuestas seguras:

```json
// Desarrollo (NODE_ENV=development)
{
  "error": "VALIDATION_ERROR",
  "message": "El campo 'name' es requerido",
  "details": [...],
  "stack": "..." // Solo en desarrollo
}

// Producción (NODE_ENV=production)
{
  "error": "VALIDATION_ERROR",
  "message": "Error de validación en los datos enviados"
}
```

**Nunca** se expone el stack trace ni detalles de infraestructura en producción.

### CORS

Whitelist explícita del origen del frontend. Sin wildcard `*`.

```typescript
cors({
  origin: process.env.CORS_ORIGIN, // 'http://localhost:3000'
  credentials: true,                // Permite cookies cross-origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

---

## 🗄️ Base de Datos

### Esquema principal

```sql
-- Usuarios y roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,  -- 'admin', 'operador', 'solo_lectura'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(150) NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Productos
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  reference VARCHAR(100) NOT NULL UNIQUE,
  category_id UUID REFERENCES categories(id),
  description TEXT,
  image_url TEXT,
  cost_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(12,2),
  stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 0,
  max_stock INT NOT NULL DEFAULT 999999,
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Movimientos
CREATE TYPE movement_type AS ENUM (
  'purchase', 'return', 'sale',
  'shrinkage', 'adjustment_in', 'adjustment_out'
);

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  type movement_type NOT NULL,
  quantity INT NOT NULL,
  reason TEXT,
  reference_doc VARCHAR(100),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proveedores
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  contact_name VARCHAR(150),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  payment_terms VARCHAR(200),
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Órdenes de compra
CREATE TYPE order_status AS ENUM ('pending', 'ordered', 'received', 'cancelled');

CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  status order_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  received_quantity INT NOT NULL DEFAULT 0
);
```

---

## 🏁 Getting Started

### Requisitos

- Node.js ≥ 20
- PostgreSQL ≥ 15
- npm / pnpm / bun

### Instalación

```bash
# Clonar el repositorio
git clone <backend-repo-url>
cd inventory-backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Editar .env con tus credenciales de PostgreSQL

# Crear la base de datos
createdb inventory

# Ejecutar migraciones
npm run db:migrate

# Seed inicial (roles + usuario admin)
npm run db:seed
```

### Desarrollo

```bash
npm run dev
```

API corriendo en [http://localhost:4000](http://localhost:4000).

### Scripts disponibles

| Comando | Descripción |
|---------|------------|
| `npm run dev` | Servidor de desarrollo con hot reload (tsx watch) |
| `npm run build` | Compilar TypeScript |
| `npm start` | Iniciar servidor en producción |
| `npm run db:migrate` | Ejecutar migraciones pendientes |
| `npm run db:seed` | Poblar datos iniciales (roles, admin user) |
| `npm test` | Ejecutar tests con Vitest |
| `npm run lint` | Linting |
| `npm run format` | Formateo de código |

---

## 🔧 Variables de Entorno

```bash
# Servidor
PORT=4000
NODE_ENV=development

# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/inventory

# JWT
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_PUBLIC=20
RATE_LIMIT_MAX_AUTH=1000

# Upload de imágenes
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Logging
LOG_LEVEL=dev
```

---

## 📐 Convenciones del Proyecto

| Aspecto | Regla |
|---------|-------|
| **Nombres de archivos** | PascalCase para clases, kebab-case para módulos |
| **Entidades** | Clases con lógica de negocio encapsulada |
| **Value Objects** | Inmutables, validan en construcción |
| **Repositorios** | Interfaces en dominio, implementaciones en infraestructura |
| **Controladores** | Sin lógica de negocio — solo extraen params, llaman use case, devuelven response |
| **Use Cases** | Una clase por caso de uso, recibe repositorios por inyección |
| **Errores** | Clases de error de dominio (NotFoundError, ValidationError, UnauthorizedError) |
| **Manejo de errores** | El error handler global mapea errores de dominio a HTTP status codes |
| **Validación** | Valibot schemas en capa de infraestructura (middleware), tipos inferidos en dominio |
| **SQL** | Queries parametrizadas, sin ORM — pg driver directo con template strings seguros |
| **Migraciones** | Archivos SQL secuenciales con `UP` y `DOWN` |
