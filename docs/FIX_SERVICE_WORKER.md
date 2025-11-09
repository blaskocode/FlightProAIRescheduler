# Fix Service Worker Issues

If you're seeing 404 errors for Next.js files (`/login/page.js`, etc.), the service worker needs to be updated.

## Quick Fix

1. **Open Browser DevTools** (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Service Workers** in the left sidebar
4. Find the service worker for `localhost:3000`
5. Click **Unregister** button
6. **Hard refresh** the page: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

## Alternative: Clear All Service Workers

In the browser console, run:

```javascript
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
  console.log('All service workers unregistered');
  location.reload();
});
```

## What Was Fixed

The service worker was intercepting Next.js internal files (`/_next/static/...`). Now it completely ignores these requests and lets Next.js handle them natively.

## After Fixing

After unregistering, the new service worker will register automatically on the next page load, and it will properly ignore Next.js internal files.

