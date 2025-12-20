import { useEffect, useState } from "react";
import * as LucideIcons from "lucide-react";

const { CheckCircle2, XCircle, AlertCircle, X } = LucideIcons;

const TOAST_DURATION = 4000; // 4秒

const toastTypes = {
  success: {
    icon: CheckCircle2,
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-800",
    iconColor: "text-green-600",
  },
  error: {
    icon: XCircle,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-800",
    iconColor: "text-red-600",
  },
  warning: {
    icon: AlertCircle,
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-800",
    iconColor: "text-yellow-600",
  },
};

function Toast({ id, message, type = "success", onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const toastConfig = toastTypes[type] || toastTypes.success;
  const IconComponent = toastConfig.icon;

  const handleClose = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // アニメーション時間に合わせる
  };

  useEffect(() => {
    // アニメーション用に少し遅延して表示
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    // 自動で閉じる
    const hideTimer = setTimeout(() => {
      handleClose();
    }, TOAST_DURATION);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [id, onClose]);

  return (
    <div
      className={`mb-3 flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-300 ${
        toastConfig.bgColor
      } ${toastConfig.borderColor} ${
        isVisible && !isRemoving
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      }`}
      role="alert"
      aria-live="polite"
    >
      <IconComponent
        size={20}
        className={`flex-shrink-0 ${toastConfig.iconColor}`}
        aria-hidden="true"
      />
      <p className={`flex-1 text-sm font-medium ${toastConfig.textColor}`}>
        {message}
      </p>
      <button
        type="button"
        onClick={handleClose}
        className={`flex-shrink-0 rounded p-1 transition hover:bg-opacity-20 hover:bg-black ${toastConfig.textColor}`}
        aria-label="閉じる"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default Toast;

