# menus (admin module)

The website **navigation-menus** editor (P7.C Stage 4) — the keyed `menu → menu_item` one-level
nested tree the website header/footer render from. Reuses the shared `SortableList` + `DynamicForm`
modal + toast + confirm.

## Purpose & IA

One sidebar entry → the content hub → a **Menus** card → `/content/menus`.

- The two fixed keyed menus (`primary` = header, `footer`) are selector **tabs**.
- A selected key that exists → its `MenuEditor`; one that hasn't been created → an "add this menu"
  prompt (menus are created on demand via `createMenu`).
- `MenuEditor` — a one-level nested tree: top-level items drag-reorder among themselves; each item's
  children drag-reorder within it. Per item: add sub-item (top-level only), edit, delete. Items edit
  in the `MENU_ITEM_FORM_MODAL` (translatable `label` per-locale tabs W6, `url`, optional `icon`).

The route is `content.read`-gated; writes are `content.manage`.

## Entities & contracts (from `@sanad/contracts` — verified, U15)

- **`MenuTree`** (read, by key) — `key` (`MenuKey` enum), `items: MenuItemNode[]`. **`MenuSummary`**
  is the list row (no items).
- **`MenuItemNode`** — `url`, `icon` (nullable), `sortOrder`, `label` (`LocalizedText`), one level of
  `children`.
- **Writes** — `MenuCreateRequest`, `MenuItemCreateRequest` (`parentId` nests one level),
  `MenuItemUpdateRequest` (partial). Ordering is owned by the reorder route.

## API (W3) — `api/menus.api.ts`

- `listMenus` `GET /content/menus` · `getMenuTree` `GET /content/menus/:key` (no draft state — the
  public tree == the admin tree).
- `createMenu` `POST /content/menus` · `createMenuItem` `POST /content/menu-items` ·
  `updateMenuItem` `PATCH /content/menu-items/:id` · `deleteMenuItem` `DELETE /content/menu-items/:id`
  · `reorderMenuItems` `PATCH /content/menu-items/reorder` (the new backend route).
- Item mutations carry the owning menu `key` so the tree query re-fetches; every write publishes
  **`content.menu.changed`** (W4).

## Tests

`menus-page.spec` — the create prompt when a keyed menu doesn't exist, and the item editor when it
does.
