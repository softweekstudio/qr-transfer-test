# Soft Week Studio — License Server Test

Local development test only.

## What it tests
- Create a unique license.
- Activate it on Device A.
- Create a 2-minute transfer token.
- Claim it on Device B.
- Move the license authorization to Device B.
- Reject reused/expired tokens.
- Revoke a license.

## Run
Requires Node.js 18+.

    node server.js

Server: http://localhost:8787
Health: http://localhost:8787/api/health

The database is intentionally in memory. Restarting the server resets the demo.
This is NOT production licensing infrastructure.
