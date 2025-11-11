import { useCallback, useRef } from "react";

function useModalBackdropClose(onClose, { disabled = false } = {}) {
  const shouldCloseRef = useRef(false);

  const resetIntent = useCallback(() => {
    shouldCloseRef.current = false;
  }, []);

  const handlePointerDown = useCallback(
    (event) => {
      if (disabled) {
        resetIntent();
        return;
      }

      if (event.target === event.currentTarget) {
        shouldCloseRef.current = true;
      } else {
        resetIntent();
      }
    },
    [disabled, resetIntent]
  );

  const handlePointerUp = useCallback(
    (event) => {
      if (disabled) {
        resetIntent();
        return;
      }

      const isBackdropTarget = event.target === event.currentTarget;
      if (!isBackdropTarget) {
        resetIntent();
        return;
      }

      if (!shouldCloseRef.current) {
        resetIntent();
        return;
      }

      resetIntent();
      onClose?.();
    },
    [disabled, onClose, resetIntent]
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
