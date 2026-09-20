# Full-stack integration

## Contract

The mobile template calls `GET /api/health` on `EXPO_PUBLIC_API_BASE_URL`. The separate Next.js template acts as a public gateway and calls PocketBase's private `GET /api/v1/health` endpoint.

The mobile response schema is:

```json
{
  "available": true,
  "apiVersion": 1,
  "service": "pocketbase-template",
  "checkedAt": "2026-09-20T00:00:00.000Z"
}
```

Change the API version before removing or redefining a field used by an independently deployed client.

## Local workflow

1. Start `pocketbase-backend-template` on its documented loopback port.
2. Start `next-frontend-template` with `POCKETBASE_URL` pointing to PocketBase.
3. Set `EXPO_PUBLIC_API_BASE_URL` to the Next.js origin and start this project.
4. Run `corepack yarn integration:check`.

On a physical device, `127.0.0.1` refers to the phone. Use an HTTPS development tunnel or the computer's reachable LAN address. Keep PocketBase private; expose only the Next.js gateway unless the product explicitly requires and secures direct realtime or file access.

Static Expo web pages run on a different origin from Next.js during local development. If the web target must call the gateway directly, configure a narrowly reviewed CORS policy on the public Next.js endpoint or serve both behind the same origin.
