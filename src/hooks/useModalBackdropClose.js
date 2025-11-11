import { useCallback, useRef } from "react";

function useModalBackdropClose(onClose, { disabled = false } = {}) {
  const shouldCloseRef = useRef(false);
  const pendingCleanupRef = useRef(null);

  const resetIntent = useCallback(() => {
    shouldCloseRef.current = false;
  }, []);

  const blockNextClick = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    pendingCleanupRef.current?.();

    let active = true;
    let timeoutId = null;

    function cleanup() {
      if (!active) {
        return;
      }
      active = false;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      window.removeEventListener("click", handleClickCapture, true);
      if (pendingCleanupRef.current === cleanup) {
        pendingCleanupRef.current = null;
      }
    }

    function handleClickCapture(event) {
      if (!active) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      cleanup();
    }

    window.addEventListener("click", handleClickCapture, true);
    timeoutId = window.setTimeout(cleanup, 1000);
    pendingCleanupRef.current = cleanup;
  }, []);

  const handlePointerDown = useCallback(
    (event) => {
      if (event.target === event.currentTarget) {
        event.preventDefault();
        event.stopPropagation();
        if (disabled) {
          resetIntent();
          return;
        }

        shouldCloseRef.current = true;
      } else {
        resetIntent();
      }
    },
    [disabled, resetIntent]
  );

  const handlePointerUp = useCallback(
    (event) => {
      const isBackdropTarget = event.target === event.currentTarget;

      if (!isBackdropTarget) {
        resetIntent();
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (disabled) {
        blockNextClick();
        resetIntent();
        return;
      }

      if (!shouldCloseRef.current) {
        resetIntent();
        return;
      }

      blockNextClick();
      resetIntent();
      onClose?.();
    },
    [blockNextClick, disabled, onClose, resetIntent]
  );

  const handlePointerCancel = useCallback(() => {
    resetIntent();
  }, [resetIntent]);

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
  };
}

export default useModalBackdropClose;
