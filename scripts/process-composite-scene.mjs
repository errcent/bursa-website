/**
 * @deprecated Use process-ipad-scene.mjs — MacBook + iPhone composite removed.
 * Build unified device scene PNG with iPad screen hole.
 * Run: node scripts/process-ipad-scene.mjs
 */
console.warn("process-composite-scene.mjs is deprecated. Running process-ipad-scene.mjs instead.");
await import("./process-ipad-scene.mjs");
