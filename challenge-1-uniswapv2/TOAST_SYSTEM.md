# 🍞 Toast Notification System

## Overview
Elegant floating toast notifications that appear in the bottom-right corner with smooth animations and auto-dismiss functionality.

## Features

### ✨ **Visual Design**
- **Floating Position**: Bottom-right corner with proper z-index
- **Smooth Animations**: Slide-in from right with scale and opacity effects
- **Glass Effect**: Semi-transparent background with backdrop blur
- **Color-coded**: Different colors for success, error, and info states
- **Progress Bar**: Visual countdown for auto-dismiss timing
- **Hover Effects**: Subtle scale and shadow changes on hover

### 🎯 **Functionality**
- **Auto-dismiss**: Configurable duration (default 5 seconds)
- **Manual Close**: X button to dismiss immediately
- **Transaction Links**: Clickable hash links to blockchain explorer
- **Stacking**: Multiple toasts stack vertically
- **Responsive**: Works on all screen sizes

### 🎨 **Toast Types**

#### Success Toast
```typescript
addToast({
  type: 'success',
  title: 'Transaction Successful!',
  message: 'Swapped 1.0 PAS → WETH',
  txHash: '0x123...abc',
  duration: 8000
});
```

#### Error Toast
```typescript
addToast({
  type: 'error',
  title: 'Transaction Failed',
  message: 'Insufficient balance',
  duration: 8000
});
```

#### Info Toast
```typescript
addToast({
  type: 'info',
  title: 'Processing Transaction',
  message: 'PAS → WETH',
  duration: 3000
});
```

## Implementation

### 1. **Toast Provider Setup**
```tsx
// app/layout.tsx
<SimpleWalletProvider>
  <ToastProvider>
    {children}
  </ToastProvider>
</SimpleWalletProvider>
```

### 2. **Using Toasts in Components**
```tsx
import { useToast } from '@/components/Toast';

function MyComponent() {
  const { addToast } = useToast();
  
  const handleSuccess = () => {
    addToast({
      type: 'success',
      title: 'Success!',
      message: 'Operation completed'
    });
  };
}
```

### 3. **Transaction Integration**
```tsx
// Automatic toast notifications for swap transactions
const { swap } = useSimpleSwap(); // Already includes toast notifications

// Manual transaction toasts
addToast({
  type: 'info',
  title: 'Transaction Submitted',
  message: 'Waiting for confirmation...',
  txHash: '0x123...abc',
  duration: 8000
});
```

## Styling

### **Color Scheme**
- **Success**: Green (`text-green-500`, `border-l-green-500`, `bg-green-500`)
- **Error**: Red (`text-red-500`, `border-l-red-500`, `bg-red-500`)
- **Info**: Blue (`text-blue-500`, `border-l-blue-500`, `bg-blue-500`)

### **Animations**
- **Entrance**: Slide from right + scale up + fade in (300ms)
- **Exit**: Slide to right + scale down + fade out (300ms)
- **Hover**: Scale up 2% + shadow increase (200ms)

### **Responsive Design**
- **Desktop**: 320px min-width, 400px max-width
- **Mobile**: Adapts to screen width with proper margins

## Browser Compatibility
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Performance
- **Lightweight**: No external dependencies
- **Efficient**: Uses CSS transforms for animations
- **Memory Safe**: Auto-cleanup with timeouts
- **Accessible**: Proper ARIA labels and keyboard navigation

## Comparison with Browser Alerts

| Feature | Browser Alert | Toast System |
|---------|---------------|--------------|
| **Position** | Center modal | Bottom-right floating |
| **Styling** | System default | Custom branded |
| **Dismissal** | Manual only | Auto + manual |
| **Multiple** | Blocks UI | Stacks nicely |
| **Links** | No | Clickable tx links |
| **Animation** | None | Smooth transitions |
| **Mobile** | Poor UX | Responsive design |

## Usage Examples

### **Swap Transaction Flow**
1. **Start**: Info toast "Processing Transaction"
2. **Submitted**: Info toast "Transaction Submitted" with hash
3. **Success**: Success toast "Transaction Successful!" with hash
4. **Error**: Error toast "Transaction Failed" with error message

### **Wallet Connection**
```typescript
// Connection success
addToast({
  type: 'success',
  title: 'Wallet Connected',
  message: `Connected to ${address.slice(0,6)}...${address.slice(-4)}`
});

// Network switch
addToast({
  type: 'info',
  title: 'Switching Network',
  message: 'Please confirm in MetaMask'
});
```

## Future Enhancements
- [ ] Sound notifications (optional)
- [ ] Persistent toasts (no auto-dismiss)
- [ ] Action buttons in toasts
- [ ] Toast history/log
- [ ] Custom positioning options
- [ ] Batch operations with progress 