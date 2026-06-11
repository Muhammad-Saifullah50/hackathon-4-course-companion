# Course Companion Web App

Next.js frontend for the standalone LMS and the shared Stytch authentication
surface used by the ChatGPT Connected App.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set the Stytch Consumer project public token.
   Set `NEXT_PUBLIC_STYTCH_SESSION_DURATION_MINUTES` to a value no greater
   than the maximum configured under Stytch SDK Configuration.
3. Enable Google OAuth and Passwords in the Stytch dashboard.
4. Allow these local redirect URLs:
   - `http://localhost:3000/authenticate`
   - `http://localhost:3000/reset-password`
   Register them without query parameters. The app preserves `return_to`
   separately in browser session storage.
5. Set the Connected Apps Authorization URL to
   `http://localhost:3000/oauth/authorize` for local testing.
6. Enable Dynamic Client Registration and the `openid`, `email`, and
   `profile` scopes in Connected Apps.

The deployed MCP server must set `MCP_SERVER_BASE_URL` to its public HTTPS
origin. ChatGPT discovers Stytch from
`/.well-known/oauth-protected-resource`; Stytch remains the authorization and
token server while this app hosts login and consent.

Run `npm install`, then `npm run dev`.
