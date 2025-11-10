import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toTwoDigits } from "../utils/toTwoDigits";
import { formatCurrencyJPY } from "../utils/currency";

const ANONYMOUS_STORAGE_KEY = "receiptNote.availableBudget.anonymous";

const getStorageKey = (userId) =>
  userId ? `receiptNote.availableBudget.${userId}` : ANONYMOUS_STORAGE_KEY;

const getMonthBoundaries = (year, monthString) => {
  const parsedMonth = Number.parseInt(monthString, 10);
  if (!Number.isFinite(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    throw new Error(`Invalid month value received: ${monthString}`);
  }

  const startMonth = toTwoDigits(parsedMonth.toString(), 2);
  const nextMonth = parsedMonth === 12 ? 1 : parsedMonth + 1;
  const nextYear = parsedMonth === 12 ? year + 1 : year;
  const normalizedNextMonth = toTwoDigits(nextMonth.toString(), 2);

  return {
    startDate: `${year}-${startMonth}-01`,
    exclusiveEndDate: `${nextYear}-${normalizedNextMonth}-01`,
  };
};

function AvailableFunds({ selectedMonth, userId, expensesVersion }) {
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [budgetInput, setBudgetInput] = useState("0");
  const [budgetError, setBudgetError] = useState("");
  const [hasLoadedBudget, setHasLoadedBudget] = useState(false);

  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [isExpensesLoading, setIsExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState("");

  const storageKey = useMemo(() => getStorageKey(userId), [userId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleStorage = (event) => {
      if (event.key !== storageKey) {
        return;
      }

      if (event.newValue === null) {
        setMonthlyBudget(0);
        setBudgetInput("0");
        setBudgetError("");
        return;
      }

      const numericValue = Number(event.newValue);

      if (!Number.isFinite(numericValue) || numericValue < 0) {
        return;
      }

      const normalized = Math.round(numericValue);
      setMonthlyBudget(normalized);
      setBudgetInput(String(normalized));
      setBudgetError("");
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setHasLoadedBudget(false);

    try {
      const storedValue = window.localStorage.getItem(storageKey);

      if (storedValue === null) {
        setMonthlyBudget(0);
        setBudgetInput("0");
        setBudgetError("");
      } else {
        const numericValue = Number(storedValue);

        if (!Number.isFinite(numericValue) || numericValue < 0) {
          setMonthlyBudget(0);
          setBudgetInput("0");
          setBudgetError("");
        } else {
          const normalized = Math.round(numericValue);
          setMonthlyBudget(normalized);
          setBudgetInput(String(normalized));
          setBudgetError("");
        }
      }
    } catch (error) {
      console.warn("Failed to read budget from storage", error);
      setMonthlyBudget(0);
      setBudgetInput("0");
      setBudgetError("");
    } finally {
      setHasLoadedBudget(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!hasLoadedBudget || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, String(monthlyBudget));
    } catch (error) {
      console.warn("Failed to persist budget to storage", error);
    }
  }, [monthlyBudget, hasLoadedBudget, storageKey]);

  useEffect(() => {
    if (!selectedMonth) {
      setMonthlyExpenses(0);
      setExpensesError("");
      setIsExpensesLoading(false);
      return;
    }

    if (!userId) {
      setMonthlyExpenses(0);
      setExpensesError("");
      setIsExpensesLoading(false);
      return;
    }

    let isMounted = true;

    const fetchMonthlyExpenses = async () => {
      setIsExpensesLoading(true);
      setExpensesError("");

      try {
        const queryYear = new Date().getFullYear();
        const { startDate, exclusiveEndDate } = getMonthBoundaries(
          queryYear,
          selectedMonth
        );

        const { data, error } = await supabase
          .from("expenses")
          .select("price")
          .eq("user_id", userId)
          .gte("expense_date", startDate)
          .lt("expense_date", exclusiveEndDate);

        if (!isMounted) {
          return;
        }

        if (error) {
          console.error("支出合計の取得に失敗しました", error);
          setMonthlyExpenses(0);
          setExpensesError(
            "支出の読み込みに失敗しました。再度お試しください。"
          );
          return;
        }

        const total = (data ?? []).reduce(
          (sum, item) => sum + (item?.price ?? 0),
          0
        );
        setMonthlyExpenses(total);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        console.error("支出合計の算出中に予期せぬエラーが発生しました", error);
        setMonthlyExpenses(0);
        setExpensesError("支出の読み込みに失敗しました。再度お試しください。");
      } finally {
        if (isMounted) {
          setIsExpensesLoading(false);
        }
      }
    };

    fetchMonthlyExpenses();

    return () => {
      isMounted = false;
    };
  }, [userId, selectedMonth, expensesVersion]);

  const availableAmount = useMemo(
    () => monthlyBudget - monthlyExpenses,
    [monthlyBudget, monthlyExpenses]
  );

  const availableAmountStyle =
    availableAmount < 0 ? "text-red-600" : "text-emerald-600";

  const handleBudgetInputChange = (event) => {
    const { value } = event.target;
    setBudgetInput(value);

    if (value === "") {
      setMonthlyBudget(0);
      setBudgetError("");
      return;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      setBudgetError("0以上の数値を入力してください。");
      return;
    }

    setMonthlyBudget(Math.round(numericValue));
    setBudgetError("");
  };

  const handleBudgetSubmit = (event) => {
    event.preventDefault();
  };

  const handleBudgetBlur = () => {
    if (budgetInput === "") {
      setMonthlyBudget(0);
      setBudgetInput("0");
      setBudgetError("");
    }
  };

  const formattedAvailable = formatCurrencyJPY(availableAmount);
  const formattedExpenses = formatCurrencyJPY(monthlyExpenses);

  return (
    <section className="px-6 pt-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            現在使えるお金
          </h2>
          <p className={`mt-2 text-3xl font-bold ${availableAmountStyle}`}>
            {isExpensesLoading ? "計算中..." : formattedAvailable}
          </p>
          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-600">
            <div>
              <dt className="font-medium text-gray-700">登録済みの支出</dt>
              <dd className="mt-1" aria-live="polite">
                {isExpensesLoading ? "計算中..." : formattedExpenses}
              </dd>
            </div>
          </dl>
          {expensesError ? (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {expensesError}
            </p>
          ) : null}
        </div>

        <form
          onSubmit={handleBudgetSubmit}
          className="flex flex-col gap-4 rounded-lg bg-gray-50 p-4"
        >
          <div className="flex-1">
            <label
              htmlFor="available-budget"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              所持金額を入力
            </label>
            <input
              id="available-budget"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={budgetInput}
              onChange={handleBudgetInputChange}
              onBlur={handleBudgetBlur}
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
            {budgetError ? (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {budgetError}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                入力すると即座に反映され、ブラウザにのみ保存されます。
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

export default AvailableFunds;
