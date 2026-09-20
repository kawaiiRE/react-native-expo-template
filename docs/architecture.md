# Architecture

The template keeps routes, UI, state, external operations, and transport contracts explicit:

```text
Expo Router screen -> component -> hook -> service -> API client
                                              -> Next.js gateway -> PocketBase
```

Screens compose the page and own local input state. Components render application-facing data. Hooks coordinate lifecycle and retries. Domain services choose endpoints and schemas. The API client owns URL construction, timeouts, safe transport errors, and response parsing. Zod contracts reject incompatible server responses before they reach UI code.

MobX is limited to the cross-screen task example. The provider owns one store instance for the React tree, while AsyncStorage is accessed behind a storage service and hydrated only after validation.

The repository has no filesystem coupling to the web or backend templates. Contract changes are synchronized deliberately by version and verified over HTTP.
