# PayloadCMS local API vs. direct Drizzle access: A complete architecture guide

PayloadCMS exposes both a high-level local API (`payload.create`, `payload.find`) and the underlying Drizzle ORM instance (`payload.db.drizzle`). **When you use Drizzle directly, you bypass all of Payload's "batteries-included" features**—hooks, access control, validation, relationship management, and transaction handling. This dual-API design is intentional: the local API provides safety and convenience for standard operations, while direct Drizzle access enables performance-critical bulk operations and complex SQL queries that the local API cannot efficiently handle.

## What you lose when using Drizzle directly

Using `payload.db.drizzle` instead of the local API means your operations skip the entire Payload request lifecycle. The official documentation states it clearly: "Making direct database calls can significantly improve performance **by bypassing much of the request lifecycle such as hooks, validations, and other overhead** associated with Payload APIs."

**Hooks do not fire.** The local API executes hooks in this order: `beforeOperation` → `beforeValidate` → validation → `beforeChange` → database write → `afterChange` → `afterOperation`. Direct Drizzle calls skip all of these. This means business logic, third-party integrations, data transformations, and side effects defined in your hooks simply don't run.

**Access control is bypassed entirely.** While the local API can enforce access control with `overrideAccess: false`, Drizzle operations have no concept of user permissions. There's no way to re-enable access checks—they're architecturally absent from this layer.

**Validation doesn't run.** Field validations (required fields, min/max constraints, custom validators) are skipped. You're responsible for ensuring data integrity before inserting into the database.

**Other bypassed features include:**

- Version history tracking (if enabled on your collection)
- Relationship depth population (you get raw foreign key IDs, not populated documents)
- Localization handling (you work with the raw database structure)
- Transaction management (you must start transactions manually)
- Hidden field processing

One community member summarized it well: "payload.db is faster, but it lacks support for lots of things like access control and hooks. It's basically a direct database call with very little payload other than where queries and pagination."

## How Payload manages relationship tables

PayloadCMS uses a centralized **`*_rels` join table pattern** for relationship fields. For a `posts` collection with relationship fields, Payload creates a single `posts_rels` table that stores all of that collection's relationships—regardless of whether they're one-to-one, one-to-many, or polymorphic.

The join table structure includes:

- A foreign key to the parent document (`parent_id`)
- Nullable foreign key columns for each related collection (e.g., `users_id`, `categories_id`)
- An `order` column for maintaining relationship ordering
- A `path` column identifying which field the relationship belongs to

**When `hasMany: true` is set**, the relationship field does not appear as a column in the main table at all—it's stored entirely in the `*_rels` join table. This is why GitHub Issue #13052 reports that `hasMany` fields don't appear in the generated Drizzle schema: they aren't columns, they're join table entries.

**If you use Drizzle directly, you must manually manage these join tables.** The local API's `upsertRow` function handles inserting into both the main table and the appropriate `*_rels` table automatically. When you bypass the local API, you need to:

1. Insert the main document
2. Insert corresponding rows into the `*_rels` table with correct `parent_id`, `path`, `order`, and related collection IDs

The Payload team chose this "fluid" join table approach specifically to avoid complex migrations when changing relationship configurations. As a maintainer explained: "We chose not to [use typical FK columns] because it would require migrations and additional logic... We chose the more fluid, less strict route."

For developers who want more control, PayloadCMS 3.x introduced the **Join field**, which allows you to define your own junction collection design and avoid the automatic `*_rels` table creation entirely.

## Design rationale for exposing both APIs

The dual-API architecture reflects Payload's philosophy of being "an ORM with superpowers." The official documentation describes Payload as containing "the logic for all Payload 'operations' like find, create, update, and delete... It executes Access Control, Hooks, Validation, and more."

**Use the local API when:**

- You need hooks to fire (integrations, notifications, data transformations)
- Access control matters (user-facing operations)
- Data validation is required
- You want automatic relationship handling
- You're performing standard CRUD operations

**Use Drizzle directly when:**

- **Bulk imports**: A common pattern for importing thousands of records. One user importing 18,000 images used direct Drizzle inserts in 500-record chunks.
- **Complex SQL queries**: Aggregations, custom joins, and queries that Payload's `where` syntax can't express.
- **Performance-critical operations**: The documentation explicitly recommends direct database calls for performance: "This can be especially useful for the update operation, where Payload would otherwise need to make multiple API calls to fetch, update, and fetch again."
- **Avoiding hook infinite loops**: When collection A's hook updates collection B, which triggers a hook that updates collection A. Direct database access breaks the loop.
- **Data migrations**: Schema migrations or data transformations where business logic shouldn't run.

James Mikrut (Payload creator) explained why Drizzle was chosen: "When you're writing Drizzle, you're actually writing like a TypeScript equivalent of the actual SQL syntax... I don't wanna deal with black magic ever."

## Type safety gaps and how to address them

### Payload's where clause lacks type safety

The `Where` type in Payload's query API accepts any string path, meaning **field names are not validated at compile time**:

```typescript
// This compiles but will fail at runtime
const posts = await payload.find({
  collection: 'posts',
  where: {
    'nonExistentField.nested': { equals: 'value' } // No TypeScript error
  }
});
```

There's also a documented bug (Issue #11927) where nested field queries don't properly AND conditions together at the top level—a security concern if used in access control. The workaround is explicit `and`/`or` keys:

```typescript
// ✅ Correct: Explicit AND
const { docs } = await payload.find({
  collection: 'entries',
  where: {
    and: [
      { 'parent.fieldA': { equals: true } },
      { 'parent.fieldB': { equals: true } }
    ]
  }
});
```

Relationship fields generate `string | RelatedType` unions in Payload's types, making it difficult to work with populated data without type guards.

### Drizzle provides full compile-time type safety

Drizzle infers types from schema definitions, catching invalid field names and type mismatches at compile time:

```typescript
// TypeScript error - column doesn't exist
db.select().from(users).where(eq(users.typo, 'test')); // ❌ Error

// TypeScript error - wrong type
db.select().from(users).where(eq(users.id, 'string')); // ❌ Error
```

### Getting typed Drizzle access

By default, `payload.db.drizzle` is typed as `NodePgDatabase<Record<string, unknown>>`—losing all type information. To get full types:

1. Generate the Drizzle schema: `npx payload generate:db-schema`
2. Cast with proper types:

```typescript
import type * as schema from './payload-generated-schema';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export const getDB = (payload) =>
  payload.db.drizzle as NodePgDatabase<typeof schema>;

const db = getDB(payload);
db.query.users.findFirst(); // ✅ Full autocomplete
```

For Payload's local API, the community-created `payload-query` npm package provides type-safe `Filter` types that validate field names and operators.

## Why bulk create is missing from the local API

**There is no `payload.createMany()` method**—this is a deliberate omission, not an oversight. The local API currently supports bulk `update` and `delete` (added in v1.6.24), but bulk create remains absent.

The architectural challenge is that Payload's create operation runs through the full hook lifecycle—**for each document**. Bulk creation would need to either:

1. Execute all hooks for every document (expensive, potentially thousands of hook invocations)
2. Provide a way to selectively skip hooks (complex API surface)
3. Skip hooks entirely (defeats the purpose of using the local API)

Discussion #10242 is an active feature request, with the community proposing: "This feature will allow developers to perform bulk actions much quicker, rely less on the DB layer, and also allow us to keep a lot of the convenience features baked into the local API."

**Current workarounds:**

For bulk inserts with hooks (slower but safe):

```typescript
const results = await Promise.all(
  items.map((item) => payload.create({ collection: 'items', data: item }))
);
```

For bulk inserts without hooks (fast but bypasses safety):

```typescript
const chunks = chunkArray(toImport, 500);
for (const chunk of chunks) {
  await payload.db.drizzle.insert(payload.db.tables['items']).values(chunk);
}
```

## Conclusion

PayloadCMS's dual-API design creates a clear architectural boundary: the local API is your **safe, feature-rich default** for application logic, while direct Drizzle access is the **performance escape hatch** for specialized operations. Understanding this boundary is essential—particularly that **relationship tables require manual management** when bypassing the local API, and that **type safety requires explicit schema generation** for Drizzle access.

The missing bulk create operation represents a genuine gap that the community has requested, with direct Drizzle inserts being the current solution for high-volume data imports. For type-safe queries, consider the `payload-query` package for Payload's API or generated Drizzle schemas for direct database access.
