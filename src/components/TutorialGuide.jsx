import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function TutorialGuide({ show, steps = defaultSteps, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [hasValidTarget, setHasValidTarget] = useState(false);
  const popupRef = useRef(null);
  const previousElementRef = useRef(null);
  const previousStylesRef = useRef(null);

  const resolvedSteps = useMemo(() => {
    if (!Array.isArray(steps) || steps.length === 0) {
      return defaultSteps;
    }
    return steps;
  }, [steps]);

  const totalSteps = resolvedSteps.length;
  const activeStep = resolvedSteps[currentStep] ?? null;

  useEffect(() => {
    if (currentStep >= totalSteps) {
      setCurrentStep(0);
    }
  }, [currentStep, totalSteps]);

  const cleanupHighlight = useCallback(() => {
    const element = previousElementRef.current;
    const originalStyles = previousStylesRef.current;

    if (element && originalStyles) {
      element.style.position = originalStyles.position ?? "";
      element.style.zIndex = originalStyles.zIndex ?? "";
      element.style.boxShadow = originalStyles.boxShadow ?? "";
      element.style.transition = originalStyles.transition ?? "";
      if (originalStyles.positionWasStatic) {
        element.style.position = "";
      }
    }

    previousElementRef.current = null;
    previousStylesRef.current = null;
  }, []);

  const positionPopup = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const step = resolvedSteps[currentStep];
    const popupNode = popupRef.current;
    const margin = 16;

    if (!popupNode) {
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let targetElement = null;

    if (step && step.elementId) {
      targetElement = document.getElementById(step.elementId);
    }

    if (!targetElement) {
      const popupRect = popupNode.getBoundingClientRect();
      const defaultTop = Math.max(
        margin,
        (viewportHeight - popupRect.height) / 2
      );
      const defaultLeft = Math.max(
        margin,
        (viewportWidth - popupRect.width) / 2
      );
      setHasValidTarget(false);
      setPopupPosition({ top: defaultTop, left: defaultLeft });
      return;
    }

    const targetRect = targetElement.getBoundingClientRect();
    const popupRect = popupNode.getBoundingClientRect();

    let proposedTop = targetRect.bottom + margin;
    if (proposedTop + popupRect.height > viewportHeight - margin) {
      proposedTop = targetRect.top - popupRect.height - margin;
    }
    if (proposedTop < margin) {
      proposedTop = margin;
    }

    let proposedLeft =
      targetRect.left + targetRect.width / 2 - popupRect.width / 2;
    if (proposedLeft < margin) {
      proposedLeft = margin;
    }
    if (proposedLeft + popupRect.width > viewportWidth - margin) {
      proposedLeft = viewportWidth - popupRect.width - margin;
    }

    setHasValidTarget(true);
    setPopupPosition({ top: proposedTop, left: proposedLeft });
  }, [currentStep, resolvedSteps]);

  const highlightElement = useCallback((element) => {
    if (!element) {
      return;
    }

    const computed = window.getComputedStyle(element);
    const snapshot = {
      position: element.style.position,
      zIndex: element.style.zIndex,
      boxShadow: element.style.boxShadow,
      transition: element.style.transition,
      positionWasStatic: computed.position === "static",
    };

    previousElementRef.current = element;
    previousStylesRef.current = snapshot;

    if (snapshot.positionWasStatic) {
      element.style.position = "relative";
    }

    element.style.zIndex = "50";
    element.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.45)";
    element.style.transition = "box-shadow 150ms ease";

    if (typeof element.scrollIntoView === "function") {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    if (!show) {
      cleanupHighlight();
      setHasValidTarget(false);
      return () => undefined;
    }

    const step = resolvedSteps[currentStep];

    cleanupHighlight();

    if (!step || !step.elementId) {
      setHasValidTarget(false);
      positionPopup();
      return () => {
        cleanupHighlight();
      };
    }

    const element = document.getElementById(step.elementId);

    if (element) {
      highlightElement(element);
    } else {
      setHasValidTarget(false);
    }

    positionPopup();

    return () => {
      cleanupHighlight();
    };
  }, [
    show,
    currentStep,
    resolvedSteps,
    highlightElement,
    cleanupHighlight,
    positionPopup,
  ]);

  useEffect(() => {
    if (!show) {
      return () => undefined;
    }

    positionPopup();

    const handleViewportChange = () => {
      positionPopup();
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [show, positionPopup]);

  useEffect(() => {
    if (show) {
      setCurrentStep(0);
    }
  }, [show]);

  const handleEnd = useCallback(() => {
    cleanupHighlight();
    setHasValidTarget(false);
    if (typeof onClose === "function") {
      onClose();
    }
    setCurrentStep(0);
  }, [cleanupHighlight, onClose]);

  const handleNext = useCallback(() => {
    if (currentStep + 1 < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      return;
    }
    handleEnd();
  }, [currentStep, totalSteps, handleEnd]);

  const handleSkip = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  if (!show || !activeStep) {
    return null;
  }

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 transition-opacity duration-200" />
      <div className="fixed inset-0 z-60 pointer-events-none">
        <div
          ref={popupRef}
          style={{
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
          }}
          className="absolute max-w-xs sm:max-w-sm rounded-lg bg-white p-5 shadow-xl ring-1 ring-blue-100 pointer-events-auto"
        >
          <div className="mb-4">
            <p className="text-xs font-medium text-blue-500">
              ステップ {currentStep + 1} / {totalSteps}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900">
              {activeStep.title}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {activeStep.description}
            </p>
            {!hasValidTarget ? (
              <p className="mt-3 text-xs text-amber-600">
                対象の要素が見つかりませんでした。要素のIDが正しいか確認してください。
              </p>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm font-medium text-gray-500 underline underline-offset-2 transition hover:text-gray-700"
            >
              スキップ
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {isLastStep ? "完了" : "次へ"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default TutorialGuide;
