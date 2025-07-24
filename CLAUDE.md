# CLAUDE.md - Project Notes

## TypeScript Import Fix

When importing interfaces/types, use type-only imports:

```typescript
// ❌ Wrong
import { AppContext, FileBrowserState } from './AppContextDef';

// ✅ Correct
import { AppContext } from './AppContextDef';
import type { FileBrowserState } from './AppContextDef';
```

This prevents runtime errors since interfaces don't exist at runtime.

## Development Notes

- You can access the app at all times under http://localhost:5173/
- You won't see any files loaded as you don't have the API keys