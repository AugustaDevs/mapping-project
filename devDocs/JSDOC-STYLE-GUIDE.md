# JSDoc Style Guide

This document outlines the JSDoc documentation standards for the mapping project.

## Overview

We use JSDoc to document our JavaScript code. JSDoc provides:
- **IDE support**: Better autocomplete, type hints, and inline documentation
- **Type safety**: Helps catch errors without TypeScript
- **Code clarity**: Makes functions and their usage immediately understandable
- **Future-proofing**: Easy migration path if we adopt TypeScript later

## When to Document

### ✅ Document These:
- **All exported functions** (public API)
- **Complex functions** with non-obvious logic
- **Functions with multiple parameters**
- **Functions with complex return types**
- **Module-level descriptions** (file header comments)
- **If in doubt, document it!**

### ❌ Skip These:
- Trivial getters/setters with obvious behavior
- Simple one-liner functions where the code is self-explanatory
- Internal helper functions that are immediately clear from context

## Documentation Format

### Basic Function Documentation

Every documented function should have:
1. A brief description (one line)
2. Parameter documentation (`@param`)
3. Return value documentation (`@returns`)

```javascript
/**
 * Creates HTML content for a POI popup marker.
 * @param {Object} poi - GeoJSON Feature object representing a POI
 * @returns {string} HTML string for the popup content
 */
export function createPopupContent(poi) {
  // ...
}
```

### Parameter Documentation

#### Required Parameters
```javascript
/**
 * @param {string} name - Name of the POI
 * @param {number} size - Size in pixels
 */
```

#### Optional Parameters
Use square brackets `[]` and include default values:
```javascript
/**
 * @param {string} emoji - Emoji character(s) to display
 * @param {number} [size=30] - Size of the marker in pixels (defaults to 30)
 */
```

#### Complex Object Parameters
Document nested properties using dot notation:
```javascript
/**
 * @param {Object} poi - GeoJSON Feature object
 * @param {Object} poi.geometry - GeoJSON geometry object
 * @param {number[]} poi.geometry.coordinates - Array of [longitude, latitude]
 * @param {Object} poi.properties - POI properties
 * @param {string} poi.properties.name - Name of the POI
 * @param {string} [poi.properties.emoji] - Emoji to display (defaults to '📍')
 */
```

### Return Value Documentation

#### Simple Return Types
```javascript
/**
 * @returns {string} HTML string for the popup content
 */
```

#### Complex Return Types
Use multiple `@returns` tags for object properties:
```javascript
/**
 * @returns {Object} GeoJSON FeatureCollection
 * @returns {string} returns.type - Always "FeatureCollection"
 * @returns {Object[]} returns.features - Array of GeoJSON Feature objects
 */
```

### Module Documentation

Add a module-level description at the top of files that export functions:
```javascript
/**
 * Admin tools for adding POIs and exporting updated JSON.
 * This module provides functionality to add new POIs to the map interactively
 * and export the combined base and draft POIs as a GeoJSON FeatureCollection.
 */
```

## Common Type Annotations

Use standard JSDoc type annotations:

- `{string}` - String
- `{number}` - Number
- `{boolean}` - Boolean
- `{Object}` - Plain object
- `{Array}` or `{Object[]}` - Array
- `{Function}` - Function
- `{void}` - No return value
- `{null}` - Null value
- `{undefined}` - Undefined value
- `{*}` - Any type (use sparingly)

### External Library Types

For external libraries, use their namespace:
```javascript
/**
 * @returns {L.Marker} The Leaflet marker instance
 */
```

## Examples

### Example 1: Simple Function
```javascript
/**
 * Clears all form input fields and resets them to default values.
 */
function clearForm() {
  // ...
}
```

### Example 2: Function with Parameters
```javascript
/**
 * Activates or deactivates add mode for placing new POIs on the map.
 * @param {boolean} active - Whether to activate add mode (true) or deactivate it (false)
 */
function setAddMode(active) {
  // ...
}
```

### Example 3: Function with Complex Parameters
```javascript
/**
 * Creates a Leaflet DivIcon configured as an emoji marker.
 * @param {string} emoji - Emoji character(s) to display as the marker
 * @param {number} [size=30] - Size of the marker in pixels (defaults to 30)
 * @returns {L.DivIcon} Leaflet DivIcon instance configured for the emoji marker
 */
export function createEmojiMarker(emoji, size = 30) {
  // ...
}
```

### Example 4: Function with No Return Value
```javascript
/**
 * Saves draft POIs to browser localStorage for persistence across sessions.
 * Errors are logged but do not throw to prevent breaking the user experience.
 */
function persistDraftToLocalStorage() {
  // ...
}
```

## Best Practices

1. **Be concise but complete**: One-line descriptions are preferred, but add more detail if needed
2. **Document "why" not just "what"**: If a function has non-obvious behavior, explain it
3. **Keep descriptions in present tense**: "Creates" not "Will create" or "Created"
4. **Match parameter names exactly**: The `@param` name must match the function parameter name
5. **Document edge cases**: If a function handles errors silently or has special behavior, mention it
6. **Use consistent terminology**: Use "POI" consistently, not "point of interest" and "POI" interchangeably

## IDE Integration

Most modern IDEs (VS Code, WebStorm, etc.) automatically parse JSDoc comments and provide:
- **Hover tooltips**: See function documentation when hovering
- **Autocomplete**: Better parameter suggestions
- **Type checking**: Warnings if you pass wrong types (with appropriate plugins)

## References

- [JSDoc Official Documentation](https://jsdoc.app/)
- [JSDoc Type Annotations](https://jsdoc.app/tags-type.html)
- [Google JavaScript Style Guide - JSDoc](https://google.github.io/styleguide/jsguide.html#jsdoc)

