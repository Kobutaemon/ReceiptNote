import { useState, useEffect, useRef, useCallback } from "react";
import * as LucideIcons from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { getTodayDateJP } from "../utils/dateUtils";
import { svgColorMap } from "../utils/colorMap";
import useModalBackdropClose from "../hooks/useModalBackdropClose";

const { Save, X } = LucideIcons;

const TRANSITION_DURATION_MS = 300;

function AddExpenseModal({
  card,
  userId,
  isOpen,
  onClose,
  onAfterClose,
  onSaved,
}) {
  const [price, setPrice] = useState("");
  const [expenseDate, setExpenseDate] = useState(getTodayDateJP());
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const modalRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);
  const previousBodyOverflowRef = useRef("");
  const wasOpenRef = useRef(false);

  const handleClose = useCallback(() => {
    if (isSaving) {
      return;
    }
    onClose();
  }, [isSaving, onClose]);

  const backdropHandlers = useModalBackdropClose(handleClose, {
    disabled: isSaving,
  });

  useEffect(() => {
    if (isOpen && card) {
      setPrice("");
      setExpenseDate(getTodayDateJP());
      setDescription("");
    }
  }, [isOpen, card]);

  useEffect(() => {
    if (!isOpen) {
      const previous = previouslyFocusedElementRef.current;
      if (previous instanceof HTMLElement) {
        previous.focus({ preventScroll: true });
      }
      return;
    }

    previouslyFocusedElementRef.current = document.activeElement;
    const node = modalRef.current;
    if (node) {
      node.focus({ preventScroll: true });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const { style } = document.body;

    if (isOpen) {
      previousBodyOverflowRef.current = style.overflow;
      style.overflow = "hidden";
    } else {
      style.overflow = previousBodyOverflowRef.current || "";
    }

    return () => {
      style.overflow = previousBodyOverflowRef.current || "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      return undefined;
    }

    if (!wasOpenRef.current) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onAfterClose?.();
      wasOpenRef.current = false;
    }, TRANSITION_DURATION_MS);

    return () => clearTimeout(timer);
  }, [isOpen, onAfterClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!card || !userId) {
      return;
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      alert("金額は1以上の数値を入力してください。");
      return;
    }

    if (!expenseDate) {
      alert("日付を入力してください。");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        user_id: userId,
        category: card.cardTitle,
        expense_date: expenseDate,
        price: numericPrice,
        description: description.trim() ? description.trim() : null,
      };

      const { error } = await supabase.from("expenses").insert(payload);

      if (error) {
        throw error;
      }

      onSaved();
      alert("支出を登録しました。");
    } catch (error) {
      console.error("支出の登録に失敗しました", error);
      alert("支出の登録に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const IconComponent = card
    ? LucideIcons[card.svgName] || LucideIcons.HelpCircle
    : null;
  const colorComponent = card ? svgColorMap[card.svgColor] : null;

  return (
    <div
      className={`fixed inset-0 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!isOpen}
      {...backdropHandlers}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-expense-modal-title"
        aria-describedby="add-expense-modal-description"
        tabIndex={-1}
        className={`bg-white rounded-lg border border-gray-300 shadow-xl p-8 m-4 w-full max-w-md transition-transform duration-300 ease-out ${
          isOpen ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="add-expense-modal-title"
          className="text-2xl font-bold mb-6 text-center"
        >
          {card ? `${card.cardTitle} に支出を追加` : "支出を追加"}
        </h2>
        <p id="add-expense-modal-description" className="sr-only">
          金額と日付、説明を入力して支出を登録できます。
        </p>

        {card && (
          <div className="mb-6 flex items-center gap-4 rounded-lg border border-black bg-white p-4">
            <div
              className={`rounded p-2 ${colorComponent?.bg ?? "bg-gray-200"}`}
            >
              {IconComponent ? (
                <IconComponent
                  size={24}
                  className={colorComponent?.text ?? "text-gray-600"}
                />
              ) : null}
            </div>
            <div>
              <p className="text-sm text-gray-600">カテゴリ</p>
              <p className="text-base font-semibold text-gray-900">
                {card.cardTitle}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              日付
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              金額
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              説明 (任意)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="メモ"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-300"
              disabled={isSaving}
            >
              <X size={16} /> キャンセル
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
            >
              <Save size={16} />
              {isSaving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddExpenseModal;
