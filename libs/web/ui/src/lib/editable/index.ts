// In-place editing primitives + the admin-injected edit seam (U10 barrel). The website never
// mounts these (no EditProvider) → plain content; the admin Content Studio wraps the canvas in an
// EditProvider so the primitives light up. Data-free: the admin wires onCommit to its mutations.
export * from './field-path.js';
export * from './edit-context.js';
export * from './editable-text.js';
export * from './editable-image.js';
export * from './record-edit-frame.js';
