# CSS Architecture Migration v1.0.0

This document tracks the in-progress migration to the new CSS architecture for v1.0.0.

## Problem Summary

The original CSS architecture had issues where:
- CSS custom properties defined on `[data-wallet-ui]`
- Utility classes scoped to `[data-wallet-ui-scope]` via post-processing
- `WalletButton` utility classes didn't match because there was no `[data-wallet-ui-scope]` ancestor
- Consumers needed `!important` and complex selectors for overrides

## Completed Work

### Phase 1: CSS Architecture Restructure ✅

**File: `packages/react/src/input.css`**

- Restructured CSS resets to be more targeted
- Changed button reset from `[data-wallet-ui] button` to `[data-wallet-ui] [data-wallet-button]`
- Added role-based selectors for dialogs/menus: `[role="dialog"]`, `[role="menu"]`, `[role="listbox"]`
- Reset now only targets library-rendered elements, not consumer custom trigger buttons
- Added `list-style: none` to wildcard reset to prevent bullet points

### Phase 2: Component Updates ✅

**ConnectWalletMenu.tsx**
- Added `role="dialog"` to the floating panel for CSS targeting and accessibility

**ConnectedWalletMenu.tsx**
- Added `role="menu"` to the floating panel for CSS targeting and accessibility

**ConnectWalletButton.tsx**
- Added `size` prop with variants: `'sm' | 'md' | 'lg'`
- Added `className` and `style` props for customization
- Uses `cn()` utility for class merging

**ConnectedWalletButton.tsx**
- Added `size` prop with variants: `'sm' | 'md' | 'lg'`
- Added `className` and `style` props for customization
- Uses `cn()` utility for class merging

**WalletButton.tsx**
- Added `size` prop that passes through to child button components
- Added `className` and `style` props for customization

### Phase 3: Example Apps ✅

**examples/react/** (Tailwind)
- Added `useEffect` to sync `.dark` class on `<html>` with theme selector
- Added `@custom-variant dark (&:where(.dark, .dark *));` to index.css for Tailwind v4 class-based dark mode

**examples/react-css-only/** (CSS-only)
- Added `useEffect` to sync `.dark` class on `<html>` with theme selector
- Added `:root.dark` CSS rules mirroring the `@media (prefers-color-scheme: dark)` styles

**examples/react-custom/** (New - Customization demos)
- Created new example demonstrating all customization patterns
- 7 examples covering CSS variables, size variants, className overrides, style overrides, custom triggers
- Both light and dark mode CSS variable overrides
- Custom trigger button with full styling control

### Phase 4: CSS Variable Architecture ✅

Theme variables defined on `[data-wallet-ui]`:
- Light mode: default values
- Dark mode via `[data-theme='dark']`: explicit dark
- Dark mode via `.dark` ancestor: Tailwind convention
- Dark mode via `@media (prefers-color-scheme: dark)`: system preference

Variables:
- `--wui-color-primary`, `--wui-color-primary-hover`, `--wui-color-primary-text`
- `--wui-color-bg`, `--wui-color-bg-secondary`, `--wui-color-bg-tertiary`, `--wui-color-bg-hover`
- `--wui-color-text`, `--wui-color-text-secondary`, `--wui-color-text-tertiary`
- `--wui-color-border`, `--wui-color-link`, `--wui-color-link-hover`
- `--wui-color-overlay`
- `--wui-color-danger-bg`, `--wui-color-danger-bg-hover`, `--wui-color-danger-text`
- `--wui-color-avatar-bg`, `--wui-color-avatar-icon`

## Remaining Work

### E2E Testing ✅
- [x] Run existing E2E tests: `pnpm test:e2e`
- [x] Verify tests pass with new architecture
- [x] Update CI workflow to run on `beta` branch
- [x] Fix Docker scripts to use Playwright v1.57.0
- [x] Fix `css-variables.spec.ts` portal selector (`#wallet-dialog-portal [data-wallet-ui]`)
- [x] Regenerate visual regression baselines via Docker
- [x] Add E2E tests for `react-custom` example app (customization tests)

### README Documentation ✅
- [x] Update main README.md with new customization API
- [x] Document CSS variable override patterns
- [x] Document size variants
- [x] Document className/style prop usage
- [x] Add migration notes for v0.x → v1.0

### Example App Consistency ✅
- [x] Review `react` and `react-css-only` examples for visual consistency with `react-custom`
- [x] Ensure all three examples demonstrate the library well
- [x] Standardize dark mode background color (`#0f172a` slate-900)
- [x] Refactor `react-css-only` App.css to use CSS variables (607 → 333 lines)
- [x] Add Inter font loading via CSS `@import`
- [x] Add CSS resets (box-sizing, margin) for consistent box model
- [x] Update Tailwind classes from gray to slate palette
- [x] Remove unused CSS classes and variables

### Final Verification ✅
- [x] Build the package: `pnpm build`
- [x] Generate CSS: `pnpm generate:css`
- [x] Verify `dist/style.css` output
- [x] Run all examples and verify functionality
- [ ] Test in consumer app (Haystack) via beta pre-release

### Release Preparation ✅
- [x] Semantic-release handles CHANGELOG.md, version, and tags automatically
- [x] Enable beta releases in `.github/workflows/release.yml`
- [x] Update E2E scripts for cross-platform compatibility (exclude button tests on macOS)

### Post-Release
- [ ] Test beta in Haystack via draft PR
- [ ] Address any issues found during testing
- [ ] Merge beta → main for stable v1.0.0 release
- [ ] Delete this migration document after stable release

## Key Files Modified

| File | Changes |
|------|---------|
| `packages/react/src/input.css` | CSS resets, theme variables |
| `packages/react/src/components/ConnectWalletMenu.tsx` | Added `role="dialog"` |
| `packages/react/src/components/ConnectedWalletMenu.tsx` | Added `role="menu"` |
| `packages/react/src/components/ConnectWalletButton.tsx` | Added size/className/style props |
| `packages/react/src/components/ConnectedWalletButton.tsx` | Added size/className/style props |
| `packages/react/src/components/WalletButton.tsx` | Added size/className/style props |
| `examples/react/src/App.tsx` | Theme sync useEffect |
| `examples/react/src/index.css` | Tailwind v4 dark mode variant |
| `examples/react-css-only/src/App.tsx` | Theme sync useEffect |
| `examples/react-css-only/src/App.css` | Class-based dark mode styles |
| `examples/react-custom/*` | New customization example |

## How Consumers Customize (Post-Migration)

### CSS Variable Overrides (Works for both Tailwind and CSS-only)
```css
[data-wallet-ui] {
  --wui-color-primary: #8b5cf6;
  --wui-color-primary-hover: #7c3aed;
}
```

### Size Variants
```tsx
<WalletButton size="sm" />
<WalletButton size="md" />  {/* default */}
<WalletButton size="lg" />
```

### className Override (Tailwind users)
```tsx
<WalletButton className="bg-purple-500 hover:bg-purple-600 rounded-full" />
```

### style Override
```tsx
<WalletButton style={{ '--wui-color-primary': '#10b981' } as React.CSSProperties} />
```

### Custom Trigger (Full control)
```tsx
<ConnectWalletMenu>
  <button className="my-custom-button">Connect</button>
</ConnectWalletMenu>
```
