/**
 * Initialize PDF.js worker configuration on first client load
 * This runs once per page load and persists across component remounts/hot reloads
 */

let initialized = false;

export async function initializePdfWorker() {
  if (initialized) return;
  if (typeof window === "undefined") return;

  try {
    const { GlobalWorkerOptions } = await import("pdfjs-dist");
    GlobalWorkerOptions.workerSrc = "";
    initialized = true;
    console.log("PDF.js worker initialized (fallback mode)");
  } catch (error) {
    console.error("Failed to initialize PDF.js:", error);
  }
}

// Initialize immediately when this module loads in the browser
if (typeof window !== "undefined") {
  initializePdfWorker();
}
