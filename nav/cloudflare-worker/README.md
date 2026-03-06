# Nav sites sync – Cloudflare Worker

This Worker stores the nav page’s site list in KV so all users see the same data.  
If you don’t deploy it, the nav page keeps using only `localStorage`.

## Deploy

1. Install Wrangler and log in:

   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. Create a KV namespace and set its id in `wrangler.toml`:

   ```bash
   npx wrangler kv namespace create SITES
   ```

   Copy the **id** from the output and replace `YOUR_KV_NAMESPACE_ID` in `wrangler.toml` with it.

3. Deploy the Worker (it must exist before you can add secrets):

   ```bash
   npx wrangler deploy
   ```

4. Set admin credentials (used for POST /auth and syncing):

   ```bash
   npx wrangler secret put ADMIN_USERNAME
   npx wrangler secret put ADMIN_PASSWORD
   ```

   Use the same username/password as in the nav admin panel (e.g. `admin` / `howcome`).

5. In `nav/script.js`, set `API_BASE` to your Worker URL, e.g.:

   ```js
   const API_BASE = "https://nav-sites-sync.<your-subdomain>.workers.dev";
   ```

## API

- **GET /sites** – Returns `{ sites: [...] }`. No auth.
- **POST /auth** – Body `{ username, password }`. Returns `{ token }` or 401.
- **POST /sites** – Header `Authorization: Bearer <token>`, body `{ sites: [...] }`. Writes the list to KV. Returns 401 if token missing or expired.

Token expiry is 24 hours. The nav page requests a new token when the admin logs in.
