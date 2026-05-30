# Storybook — Seyf UI Kit

Isolated workbench for Seyf's UI primitives (`components/ui/`) and app composites (`components/app/`).

## Run locally

```bash
pnpm storybook        # dev server at http://localhost:6006
pnpm build-storybook  # static build → storybook-static/
```

## Theme toggle

The toolbar has a **Light / Dark** switcher that toggles the `.dark` class on the preview root — the same strategy used by `next-themes` in the app.

## Adding a new story

1. Create `components/ui/my-component.stories.tsx` (or `components/app/`) next to the component file.
2. Export a `Meta` default and at least two named `Story` exports (default state + one edge state).
3. Use only mock props — no real API calls, no Pollar SDK, no `lib/seyf/*` server modules.

Minimal template:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MyComponent } from './my-component';

const meta: Meta<typeof MyComponent> = {
  title: 'UI/MyComponent',   // or 'App/MyComponent'
  component: MyComponent,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof MyComponent>;

export const Default: Story = { args: { /* ... */ } };
export const EdgeState: Story = { args: { /* ... */ } };
```

## Mocking hooks / fetch

For components that call `fetch` internally, override `globalThis.fetch` in `beforeEach`:

```tsx
beforeEach() {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ /* mock */ }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
},
```

For components that use hooks like `useSeyfWallet`, mock the module with `vi.mock` at the top of the story file (before importing the component):

```tsx
import { vi } from 'vitest';
vi.mock('@/lib/seyf/use-seyf-wallet', () => ({
  useSeyfWallet: () => ({ wallet: null, loading: false, error: null }),
}));
const { MyComponent } = await import('./my-component');
```
