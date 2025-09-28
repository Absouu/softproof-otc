This is a Next.js project.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Populate `.env.local` with the required keys:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   JWT_SECRET=...
   BLOCKCYPHER_TOKEN=...
   ALCHEMY_KEY=...
   ALCHEMY_ETH_URL=...
   BASE_URL=http://localhost:3000
   ```
3. Apply Supabase SQL (`supabase-schema-updated.sql`).
4. Run the dev server:
   ```bash
   npm run dev
   ```

Login is required before generating proofs; Supabase manages auth and wallet ownership.
