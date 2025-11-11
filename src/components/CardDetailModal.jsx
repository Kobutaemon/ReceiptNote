import { useEffect, useMemo, useRef, useState } from "react";
import * as LucideIcons from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { svgColorMap } from "../utils/colorMap";
import { formatCurrencyJPY } from "../utils/currency";
import { getMonthBoundaries } from "../utils/dateUtils";
import EditExpenseModal from "./EditExpenseModal";

const TRANSITION_DURATION_MS = 250;

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  month: "numeric",
  day: "numeric",
  weekday: "short",
});

// シンプルなヘルパーでフォーカスやスクロール固定を扱う
function useModalLifecycle(isOpen, { onClose, onAfterClose }) {
  const modalRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);
  const previousBodyOverflowRef = useRef("");
  const wasOpenRef = useRef(false);

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

  return modalRef;
}

const buildDisplayDate = (isoDate) => {
  if (!isoDate) {
    return "-";
  }

  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }

  return dateFormatter.format(parsed);
};

function CardDetailModal({
  card,
  userId,
  selectedMonth,
  isOpen,
  onClose,
  onAfterClose,
  onExpenseMutated,
}) {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingExpense, setEditingExpense] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const modalRef = useModalLifecycle(isOpen, {
    onClose,
    onAfterClose: () => {
      setExpenses([]);
      setError("");
      setEditingExpense(null);
      setIsEditModalOpen(false);
      setPendingDeleteId(null);
      onAfterClose?.();
    },
  });

  useEffect(() => {
    if (!isOpen || !card || !userId || !selectedMonth) {
      return;
    }

    let isMounted = true;

    const fetchExpenses = async () => {
      setIsLoading(true);
      setError("");

      try {
        const queryYear = new Date().getFullYear();
        const { startDate, exclusiveEndDate } = getMonthBoundaries(
          queryYear,
          selectedMonth
        );

        const { data, error: supabaseError } = await supabase
          .from("expenses")
          .select("id, expense_date, price, description, created_at")
          .eq("user_id", userId)
          .eq("category", card.cardTitle)
          .gte("expense_date", startDate)
          .lt("expense_date", exclusiveEndDate)
          .order("expense_date", { ascending: false })
          .order("created_at", { ascending: false });

        if (!isMounted) {
          return;
        }

        if (supabaseError) {
          throw supabaseError;
        }

        setExpenses(data ?? []);
      } catch (fetchError) {
        console.error("カテゴリ詳細の読み込みに失敗しました", fetchError);
        if (isMounted) {
          setExpenses([]);
          setError(
            "データの読み込みに失敗しました。時間をおいて再度お試しください。"
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchExpenses();

    return () => {
      isMounted = false;
    };
  }, [isOpen, card, userId, selectedMonth]);

  const total = useMemo(() => {
    if (!expenses.length) {
      return 0;
    }

    return expenses.reduce((sum, expense) => sum + (expense?.price ?? 0), 0);
  }, [expenses]);

  const IconComponent = card
    ? LucideIcons[card.svgName] || LucideIcons.HelpCircle
    : null;
  const colorComponent = card ? svgColorMap[card.svgColor] : null;

  const monthLabel = useMemo(() => {
    if (!selectedMonth) {
      return "";
    }

    try {
      const monthNumber = Number.parseInt(selectedMonth, 10);
      if (!Number.isFinite(monthNumber)) {
        return `${selectedMonth}月`;
      }
      return `${monthNumber}月の内訳`;
    } catch (formatError) {
      console.warn("Failed to format month label", formatError);
      return `${selectedMonth}月`;
    }
  }, [selectedMonth]);

  const handleOpenEditModal = (expense) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleEditModalAfterClose = () => {
    setEditingExpense(null);
  };

  const handleExpenseUpdated = (updatedExpense) => {
    setExpenses((prev) =>
      prev.map((expense) =>
        expense.id === updatedExpense.id
          ? { ...expense, ...updatedExpense }
          : expense
      )
    );
    onExpenseMutated?.();
  };

  const handleDeleteExpense = async (expense) => {
    if (!userId || !expense) {
      return;
    }

    const confirmed = window.confirm(
      "この支出を削除しますか？この操作は元に戻せません。"
    );

    if (!confirmed) {
      return;
    }

    setPendingDeleteId(expense.id);

    try {
      const { error: deleteError } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expense.id)
        .eq("user_id", userId);

      if (deleteError) {
        throw deleteError;
      }

      setExpenses((prev) => prev.filter((item) => item.id !== expense.id));

      if (editingExpense?.id === expense.id) {
        setIsEditModalOpen(false);
        setEditingExpense(null);
      }

      onExpenseMutated?.();
      alert("支出を削除しました。");
    } catch (deleteError) {
      console.error("支出の削除に失敗しました", deleteError);
      alert("支出の削除に失敗しました。");
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-sm transition-opacity duration-200 ${
        isOpen ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!isOpen}
      onClick={() => {
        if (!isLoading) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-detail-modal-title"
        tabIndex={-1}
        className={`m-4 w-full max-w-xl transform rounded-lg border border-gray-200 bg-white shadow-xl transition-transform duration-200 ease-out ${
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
                id="card-detail-modal-title"
                className="text-lg font-semibold text-gray-900"
              >
                {card?.cardTitle ?? "カテゴリ"}
              </h2>
              <p className="text-sm text-gray-500">{monthLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            aria-label="閉じる"
          >
            <LucideIcons.X size={20} />
          </button>
        </header>

        <section className="px-6 py-4">
          <p className="text-sm text-gray-600">合計</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrencyJPY(total)}
          </p>
        </section>

        <section className="max-h-[50vh] overflow-y-auto border-t border-gray-100">
          {isLoading ? (
            <div className="flex items-center justify-center px-6 py-12 text-sm text-gray-500">
              読み込み中です...
            </div>
          ) : error ? (
            <div className="px-6 py-8 text-sm text-red-600" role="alert">
              {error}
            </div>
          ) : expenses.length === 0 ? (
            <div className="px-6 py-12 text-sm text-gray-500">
              この月の支出はまだありません。
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {expenses.map((expense) => (
                <li key={expense.id} className="px-6 py-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrencyJPY(expense.price ?? 0)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {buildDisplayDate(expense.expense_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(expense)}
                          className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isLoading || pendingDeleteId === expense.id}
                        >
                          <LucideIcons.Pencil size={16} /> 編集
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(expense)}
                          className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isLoading || pendingDeleteId === expense.id}
                        >
                          <LucideIcons.Trash2 size={16} />
                          {pendingDeleteId === expense.id
                            ? "削除中..."
                            : "削除"}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {expense.description?.trim() || "(メモなし)"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <EditExpenseModal
          isOpen={isEditModalOpen}
          expense={editingExpense}
          card={card}
          userId={userId}
          onClose={handleCloseEditModal}
          onAfterClose={handleEditModalAfterClose}
          onSaved={handleExpenseUpdated}
        />
      </div>
    </div>
  );
}

export default CardDetailModal;
