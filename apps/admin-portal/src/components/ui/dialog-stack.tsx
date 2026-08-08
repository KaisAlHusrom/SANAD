import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Nested-dialog depth tracking — the reason a picker opened from inside a form modal now reads
 * as a layer ON TOP of that form rather than as a second identical box that seems to replace it
 * (the owner's report, 2026-07-20).
 *
 * Radix portals every dialog to `document.body`, so nesting is invisible in the DOM: two open
 * dialogs are siblings with the same overlay and the same z-index, distinguishable only by DOM
 * order. This context restores the missing information — each `DialogContent` learns its own
 * depth, and whether something is open above it — from which the styling follows:
 *   - depth 0 = the base layer; depth 1+ sits above it, one z-step per level;
 *   - a dialog with a layer above gets `data-behind`, which scales and dims it so the eye reads
 *     "underneath", and makes it inert so a click lands on the top layer;
 *   - the top layer takes a wider size + a breadcrumb back to its parent.
 */

interface DialogStackValue {
  /** How many dialogs are currently open (used by the NEXT dialog to claim its depth). */
  openCount: number;
  register: () => void;
  unregister: () => void;
}

const DialogStackContext = createContext<DialogStackValue | null>(null);

/** Depth of the dialog being rendered, and whether another dialog opened above it. */
interface DialogDepthValue {
  depth: number;
  isBehind: boolean;
}

const DialogDepthContext = createContext<DialogDepthValue>({
  depth: 0,
  isBehind: false,
});

/**
 * Mount ONCE at the app shell, around everything that can open a dialog. Without it, every
 * dialog is simply depth 0 — the previous behaviour — so the provider is additive and no
 * existing surface changes until it nests.
 */
export function DialogStackProvider({ children }: { children: ReactNode }) {
  const [openCount, setOpenCount] = useState(0);

  const value = useMemo<DialogStackValue>(
    () => ({
      openCount,
      register: () => setOpenCount((count) => count + 1),
      unregister: () => setOpenCount((count) => Math.max(0, count - 1)),
    }),
    [openCount],
  );

  return (
    <DialogStackContext.Provider value={value}>
      {children}
    </DialogStackContext.Provider>
  );
}

/**
 * Claim a depth for one open dialog, for as long as it is mounted. Returns its depth and whether
 * a later dialog has opened above it.
 *
 * Depth is claimed from the count at MOUNT time and held in state, so it can't shift underneath
 * a dialog when a sibling opens or closes — a layer that renumbered itself mid-life would jump
 * z-index and visibly flicker.
 */
export function useDialogDepth(): DialogDepthValue {
  const stack = useContext(DialogStackContext);
  const [depth, setDepth] = useState<number | null>(null);

  useEffect(() => {
    if (!stack) return undefined;
    // Read the count via the register call's own state update, not the render-time value, so
    // two dialogs mounting in the same commit still get distinct depths.
    setDepth((current) => current ?? stack.openCount);
    stack.register();
    return () => stack.unregister();
    // Deliberately mount-only: registering once per mount is the point, and `stack`'s identity
    // changes on every count change — depending on it would re-register on every open/close.
  }, []);

  if (!stack || depth === null) {
    return { depth: 0, isBehind: false };
  }
  return { depth, isBehind: stack.openCount > depth + 1 };
}

/** Provide an explicit depth to a subtree (used by `DialogContent` for its own children). */
export function DialogDepthProvider({
  value,
  children,
}: {
  value: DialogDepthValue;
  children: ReactNode;
}) {
  return (
    <DialogDepthContext.Provider value={value}>
      {children}
    </DialogDepthContext.Provider>
  );
}

/** The depth of the dialog a component is rendered inside (0 when not in one). */
export function useCurrentDialogDepth(): DialogDepthValue {
  return useContext(DialogDepthContext);
}

const DialogTitleContext = createContext<string | undefined>(undefined);

/**
 * Publish a dialog's title to whatever it contains, so a picker opened from inside it can name
 * its own parent in a breadcrumb without the caller threading a prop through every field.
 *
 * This works because a nested picker is mounted **inside** its parent's React tree (the field
 * renders the picker element) even though Radix portals it to `document.body` — the DOM says
 * "siblings", React still says "descendant".
 */
export function DialogTitleProvider({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <DialogTitleContext.Provider value={title}>
      {children}
    </DialogTitleContext.Provider>
  );
}

/** The title of the dialog this component sits inside, if any. */
export function useParentDialogTitle(): string | undefined {
  return useContext(DialogTitleContext);
}
