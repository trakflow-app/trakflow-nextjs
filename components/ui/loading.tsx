'use client';

/**
 * This is the props for the loading state
 */
interface LoadingStateScreenProps {
  /** Determines whether the modal is visible */
  visible?: boolean;
}

export default function LoadingScreen({
  visible = true,
}: LoadingStateScreenProps) {
  // If we manually hide it, return nothing
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      {/* The Animated Spinner */}
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

      {/* Optional Loading Text */}
      <p className="mt-4 text-sm font-medium text-gray-600">
        Loading, please wait...
      </p>

      {/* Hidden text for screen readers */}
      <span className="sr-only">Loading content...</span>
    </div>
  );
}
