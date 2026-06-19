## Runtime & Package Manager

Use Bun as the runtime and package manager for all commands:

- `bun <file>` instead of `node <file>` or `ts-node <file>`
- `bun install` instead of `npm install` / `yarn install` / `pnpm install`
- `bun run <script>` instead of `npm run <script>`
- `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads `.env` — do not use `dotenv`.

## HTTP Server

Use **Express** for the HTTP server and routing. Do not use `Bun.serve()`.

```ts
import express from "express";

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
```

## Database

Use **pg** (node-postgres) as the PostgreSQL driver with parametrized queries. Do not use `Bun.sql`, `postgres.js`, or ORMs.

```ts
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const result = await pool.query(
  "SELECT id, name FROM products WHERE category_id = $1",
  [categoryId]
);
```

## Testing

Use **Vitest** for unit and integration tests. Do not use `bun test` or `jest`.

```ts
import { describe, it, expect } from "vitest";

describe("Product", () => {
  it("should create a valid product", () => {
    expect(true).toBe(true);
  });
});
```

Run tests with: `bun run vitest` or `bunx vitest`

## Validation

Use **Valibot** for runtime schema validation with type inference.

```ts
import { object, string, pipe, minLength, maxLength } from "valibot";

const CreateProductSchema = object({
  name: pipe(string(), minLength(1), maxLength(200)),
  reference: pipe(string(), minLength(1), maxLength(100)),
});
```

## Linting & Formatting

Use **Biome** for linting and formatting.

## Project Conventions

- **Clean Architecture**: domain → application → infrastructure → presentation
- **Domain**: Pure entities and value objects, no framework dependencies
- **Application**: Use cases orchestrate entities through repository interfaces
- **Infrastructure**: Express, pg, JWT, bcrypt — implements domain contracts
- **Presentation**: Thin controllers that translate HTTP ↔ domain
- **Files**: PascalCase for classes, kebab-case for modules
- **SQL**: Parametrized queries only — never string concatenation
- **Errors**: Custom domain error classes mapped to HTTP status codes by global error handler
