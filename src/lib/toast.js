// Tiny event-based toast: call toast('Saved') from anywhere, <Toaster /> shows it.
//   toast('Added to your bag', { action: { label: 'View bag', to: '/cart' } });
//   toast('Something went wrong', { tone: 'error' });
export function toast(message, options = {}) {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, ...options } }));
}
