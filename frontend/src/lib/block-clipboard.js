// Spread onto a password <Input> to block copy, cut, paste and drag-drop.
export const blockClipboard = {
  onPaste: (e) => e.preventDefault(),
  onCopy: (e) => e.preventDefault(),
  onCut: (e) => e.preventDefault(),
  onDrop: (e) => e.preventDefault(),
}