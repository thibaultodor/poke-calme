/** Keyboard focus stays in a modal; nested native dialogs keep their own Escape. */
export function modal(node: HTMLElement, onclose: () => void) {
  const document = node.ownerDocument;
  const previous = document.activeElement as HTMLElement | null;
  const selector =
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]';
  const focusable = () =>
    [...node.querySelectorAll<HTMLElement>(selector)].filter(
      (element) =>
        element.getClientRects().length > 0 &&
        !element.closest('[inert], [aria-hidden="true"]'),
    );
  node.focus({ preventScroll: true });
  function keydown(event: KeyboardEvent) {
    if (document.querySelector("dialog[open]")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onclose();
    } else if (event.key === "Tab") {
      const items = focusable();
      const first = items[0];
      const last = items.at(-1);
      if (!first) {
        event.preventDefault();
        node.focus();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === node)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === node)
      ) {
        event.preventDefault();
        first.focus();
      }
    }
  }
  document.addEventListener("keydown", keydown, true);
  return {
    destroy() {
      document.removeEventListener("keydown", keydown, true);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    },
  };
}
