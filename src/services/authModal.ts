export function triggerAuthModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open_auth_modal'));
  }
}
