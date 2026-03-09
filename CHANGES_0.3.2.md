# ImageLint v0.3.2 — Bug Fixes & Format Filtering

## Date

March 9, 2026

## Issues Fixed

### Issue 1: GIF Files Being Scanned Unnecessarily

**Problem**: The extension was scanning GIF files for optimization, but GIFs support animation which would be lost if converted to WebP.

**Solution**:

- Removed `.gif` from the scan glob pattern in `scanner.ts` (now only scans `.png`, `.jpg`, `.jpeg`)
- Updated `SUPPORTED_IMAGE_EXTENSIONS` in `utils.ts` to reflect only convertible formats
- Updated `README.md` to clarify which formats are scanned vs. recognized

**Files Changed**:

- `src/scanner.ts`: Changed `IMAGE_GLOB` from `'**/*.{png,jpg,jpeg,gif,svg}'` to `'**/*.{png,jpg,jpeg}'`
- `src/utils.ts`: Changed `SUPPORTED_IMAGE_EXTENSIONS` from `['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif']` to `['.png', '.jpg', '.jpeg']`
- `src/analyzer.ts`: Removed dead code for `.svg` and `.gif` metadata extraction
- `README.md`: Clarified supported formats section

### Issue 2: Audit Report Loading State Race Condition

**Problem**: When users opened the audit report from the status bar, sometimes it showed "Analyzing images..." indefinitely until they clicked "Rescan".

**Root Cause**: The WebView HTML had the loading state visible by default, and there was a timing issue where the data message sometimes didn't arrive or wasn't processed before the user saw the loading spinner.

**Solution**:

- Added `hidden` class to the loading state div in the HTML
- Since data is always available when `report.show()` is called, the loading state should only appear when the user manually clicks "Rescan"

**Files Changed**:

- `webview/report.html`: Added `hidden` class to `<div class="loading" id="loadingState">`

## Testing

- ✅ Build: `npm run build` passes without errors
- ✅ Lint: `npm run lint` passes without warnings
- ✅ Manual: Verified GIF files are no longer flagged in scan results
- ✅ Manual: Verified audit report shows data immediately without "Analyzing..." state

## Version

- Previous: 0.3.1
- Current: 0.3.2

## Format Support Summary

**Scanned for Optimization:**

- PNG
- JPEG/JPG

**Recognized as Modern (Skip):**

- WebP
- AVIF

**Not Scanned:**

- GIF (animation loss concern)
- SVG (different optimization model)
