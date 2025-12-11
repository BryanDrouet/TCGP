# Poké-TCG Ultimate - Changelog

## 2025-12-11 - PWA, Logging, and Security Improvements

### Fixed
- **PWA 404 Routing Issue**: Fixed the issue where the PWA would redirect to a 404 page when installed as an application
  - Updated service worker to properly handle navigation requests
  - Added fallback to `index.html` for failed navigation requests
  - Updated `manifest.json` to use `./index.html` as start_url for better compatibility
  - Incremented cache version to v3 to ensure users get the latest updates

### Added
- **Comprehensive Logging System**:
  - New `Logger` utility with multiple log levels (info, warn, error, debug)
  - Automatic capture of global JavaScript errors and unhandled promise rejections
  - Log persistence to localStorage (last 50 entries)
  - Colored console output for easier debugging
  - Logs include timestamp, user agent, and URL context
  - Access logs programmatically via `window.Logger.getLogs()`
  - Service worker logging for PWA-related events
  - PWA installation event logging

- **GitHub Actions Security Workflow**:
  - CodeQL security scanning for JavaScript vulnerabilities
  - Dependency vulnerability checking with npm audit
  - Responsive design validation (viewport meta tag, media queries)
  - Accessibility checks (alt attributes, aria-labels, semantic HTML)
  - PWA manifest and service worker validation

### Improved
- Service worker error handling and logging
- PWA installation tracking and debugging

## Device Compatibility

The application is fully responsive and compatible with:
- **Desktop**: All modern browsers (Chrome, Firefox, Safari, Edge)
- **Tablets**: iPad, Android tablets (portrait and landscape)
- **Smartphones**: iPhone, Android phones (all sizes)
- **PWA Mode**: Works offline when installed as a Progressive Web App

### Responsive Features
- Viewport optimized for mobile devices
- Touch-friendly interactions (active states instead of hover on touch devices)
- Media queries for 6 different screen size ranges
- Flexible layouts that adapt to screen width
- Print-friendly styles

## Debugging

### Access Logs
To view application logs in the browser console:
```javascript
// Get all logs
Logger.getLogs()

// Clear logs
Logger.clearLogs()

// Add custom log
Logger.info('My message', { some: 'data' })
Logger.warn('Warning message')
Logger.error('Error message', errorObject)
```

### Service Worker Debugging
1. Open DevTools > Application > Service Workers
2. Check console for SW logs prefixed with `[SW-INFO]`, `[SW-WARN]`, `[SW-ERROR]`
3. Use "Update on reload" during development
4. Clear cache and unregister SW to test fresh installation

## Security

The project now includes automated security checks via GitHub Actions:
- **CodeQL**: Static code analysis for security vulnerabilities
- **Dependency Scanning**: Checks for known vulnerabilities in dependencies
- **Accessibility**: Ensures the app is accessible to all users

## Migration Notes

### For Existing Users
- The service worker will automatically update to v3
- Existing logs will be preserved in localStorage
- No action required from users

### For Developers
- Replace `console.log()` with `Logger.info()` for better debugging
- Use `Logger.error()` for error handling to capture stack traces
- Check GitHub Actions tab for security and compatibility reports
