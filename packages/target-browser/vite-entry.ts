// Vite entry point for browser target
// This ensures the runtime is initialized before the frontend loads

// First, import and initialize the browser runtime (sets window.r)
import './runtime-browser/runtime'

// Then import the frontend main module
import '../frontend/src/main'
