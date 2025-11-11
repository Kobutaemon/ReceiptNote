import { useEffect, useRef, useState } from "react";
import * as LucideIcons from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { svgColorMap } from "../utils/colorMap";
import { formatCurrencyJPY } from "../utils/currency";
import { getTodayDateJP } from "../utils/dateUtils";

const { Save, X } = LucideIcons;

const TRANSITION_DURATION_MS = 250;

function EditExpenseModal({
  isOpen,
  expense,
  card,
  userId,
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

  useEffect(() => {
    if (!isOpen || !expense) {
      return;
    }

    setPrice(String(expense.price ?? ""));
    setExpenseDate(expense.expense_date ?? getTodayDateJP());
    setDescription(expense.description ?? "");
  }, [isOpen, expense]);

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
      return () => undefined;
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
      return () => undefined;
    }

    if (!wasOpenRef.current) {
      return () => undefined;
    }

    const timer = setTimeout(() => {
      onAfterClose?.();
      wasOpenRef.current = false;
    }, TRANSITION_DURATION_MS);

    return () => clearTimeout(timer);
  }, [isOpen, onAfterClose]);

  const handleClose = () => {
    if (isSaving) {
      return;
    }
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!expense || !userId) {
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
        price: Math.round(numericPrice),
        expense_date: expenseDate,
        description: description.trim() ? description.trim() : null,
      };

      const { data, error } = await supabase
        .from("expenses")
        .update(payload)
        .eq("id", expense.id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      onSaved?.({ ...expense, ...data });
      onClose();
      alert("支出を更新しました。");
    } catch (updateError) {
      console.error("支出の更新に失敗しました", updateError);
      alert("支出の更新に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const IconComponent = card
    ? LucideIcons[card.svgName] || LucideIcons.HelpCircle
    : null;
  const colorComponent = card ? svgColorMap[card.svgColor] : null;

  const formattedCurrentPrice = expense
    ? formatCurrencyJPY(expense.price ?? 0)
    : null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-sm transition-opacity duration-200 ${
        isOpen ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!isOpen}
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-expense-modal-title"
        aria-describedby="edit-expense-modal-description"
        tabIndex={-1}
        className={`m-4 w-full max-w-md transform rounded-lg border border-gray-200 bg-white shadow-xl transition-transform duration-200 ease-out ${
          isOpen ? "scale-100" : "scale-95"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <div
              className={`rounded p-2 ${colorComponent?.bg ?? "bg-gray-200"}`}
              aria-hidden="true"
            >
              {IconComponent ? (
                <IconComponent
                  size={24}
                  className={colorComponent?.text ?? "text-gray-600"}
                />
              ) : null}
            </div>
            <div>
              <h2
                id="edit-expense-modal-title"
                className="text-lg font-semibold text-gray-900"
              >
                {card?.cardTitle ?? "カテゴリ"} の支出を編集
              </h2>
              {formattedCurrentPrice ? (
                <p className="text-xs text-gray-500">
                  現在の登録金額: {formattedCurrentPrice}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </header>

        <section className="px-6 py-4">
          <p
            id="edit-expense-modal-description"
            className="text-sm text-gray-600"
          >
            金額、日付、メモを更新できます。
          </p>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 pb-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              日付
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={(event) => setExpenseDate(event.target.value)}
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
              onChange={(event) => setPrice(event.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              メモ (任意)
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="メモ"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
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

export default EditExpenseModal;
