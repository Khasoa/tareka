type VTDocument = {
  startViewTransition?: (update: () => Promise<void> | void) => {
    finished: Promise<void>;
  };
};

let release: (() => void) | null = null;
let safetyTimer: number | null = null;

export function finishCardTransition() {
  if (safetyTimer != null) {
    window.clearTimeout(safetyTimer);
    safetyTimer = null;
  }
  release?.();
  release = null;
}

export function startCardTransition(
  direction: "up" | "down",
  navigate: () => void,
) {
  const doc = document as unknown as VTDocument;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (typeof doc.startViewTransition !== "function" || reduce) {
    navigate();
    return;
  }

  // A second activation while a transition is pending should still navigate,
  // without stacking another View Transition on top.
  if (release) {
    navigate();
    return;
  }

  const root = document.documentElement;
  root.dataset.card = direction;

  let transition: { finished: Promise<void> };

  try {
    transition = doc.startViewTransition(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
          navigate();
          safetyTimer = window.setTimeout(() => {
            if (release === resolve) finishCardTransition();
          }, 3000);
        }),
    );
  } catch {
    delete root.dataset.card;
    navigate();
    return;
  }

  const cleanup = () => {
    delete root.dataset.card;
  };
  transition.finished.then(cleanup, cleanup);
}
