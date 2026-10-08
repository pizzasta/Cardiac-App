// A tiny in-app signal for "reminder settings changed", so Plan and Settings
// can re-read isEnabled() when the other one flips the switch.
type Listener = () => void;

const listeners = new Set<Listener>();

export function emitNotifsChanged(): void {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch {
      // One bad listener shouldn't stop the others.
    }
  });
}

// Returns an unsubscribe function.
export function onNotifsChanged(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
