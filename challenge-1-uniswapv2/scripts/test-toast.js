// Test script to demonstrate toast notifications
// This would be used in the browser console to test toasts

console.log(`
🎉 Toast Notification System Ready!

To test toasts in the browser console:

1. Success Toast:
   window.testToast('success')

2. Error Toast:
   window.testToast('error')

3. Info Toast:
   window.testToast('info')

4. Transaction Toast:
   window.testToast('transaction')
`);

// This would be added to the window object in development
if (typeof window !== 'undefined') {
  window.testToast = (type) => {
    const toastEvent = new CustomEvent('test-toast', {
      detail: { type }
    });
    window.dispatchEvent(toastEvent);
  };
} 