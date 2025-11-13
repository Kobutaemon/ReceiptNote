import { useCallback, useEffect, useMemo, useState } from "react";
import CardList from "../components/CardList";
import MonthSelector from "../components/MonthSelector";
import AvailableFunds from "../components/AvailableFunds";
import { getCurrentMonth, getCurrentYear } from "../utils/dateUtils";
import { supabase } from "../lib/supabaseClient";
import TutorialGuide from "../components/TutorialGuide";

const TUTORIAL_VERSION = "2025-11-guide-v1";
const TUTORIAL_STORAGE_PREFIX = "receiptNote.tutorial.seen.";

const buildYearRange = (startYear, endYear) => {
  const safeStart = Number.isFinite(startYear) ? startYear : endYear;
  const safeEnd = Number.isFinite(endYear) ? endYear : safeStart;
  const lowerBound = Math.min(safeStart, safeEnd);
  const upperBound = Math.max(safeStart, safeEnd);
  const years = [];

  for (let year = upperBound; year >= lowerBound; year -= 1) {
    years.push(year.toString());
  }

  return years;
};

const extractYear = (dateString) => {
  if (typeof dateString !== "string" || dateString.length < 4) {
    return null;
  }

  const parsed = Number.parseInt(dateString.slice(0, 4), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

function Dashboard({ user, onLogout }) {
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [expensesVersion, setExpensesVersion] = useState(0);
  const [yearOptions, setYearOptions] = useState([]);
  const [isTutorialVisible, setIsTutorialVisible] = useState(false);

  const handleExpensesMutated = useCallback(() => {
    setExpensesVersion((prev) => prev + 1);
  }, []);

  const tutorialStorageKey = useMemo(
    () => `${TUTORIAL_STORAGE_PREFIX}${user?.id ?? "anonymous"}`,
    [user?.id]
  );

  const tutorialSteps = useMemo(
    () => [
      {
        elementId: "tutorial-card-grid",
        title: "カテゴリ別カード",
        description:
          "各カードはカテゴリに対応しており、選択した年月の支出をまとめて確認できます。",
      },
      {
        elementId: "tutorial-card-first-add",
        title: "＋ボタンで支出追加",
        description:
          "カード右上の＋ボタンから、そのカテゴリに新しい支出を登録できます。",
      },
      {
        elementId: "tutorial-card-first",
        title: "カードを開いて管理",
        description:
          "カード自体をクリックすると、選択中の年月に登録した支出を閲覧・編集できます。",
      },
      {
        elementId: "tutorial-card-first-menu",
        title: "カードの編集メニュー",
        description:
          "カード右上のケバブメニュー（⋮）からカテゴリ名やアイコンなどを編集できます。",
      },
      {
        elementId: "tutorial-card-grid",
        title: "支出が多い順に整列",
        description:
          "カードは登録された支出が多いカテゴリほど上に表示されるよう並び替えられます。",
      },
      {
        elementId: "tutorial-expense-chart",
        title: "支出割合をチェック",
        description:
          "支出割合セクションでは、選択した年月のカテゴリ別支出を円グラフで把握できます。",
      },
      {
        elementId: "tutorial-available-funds",
        title: "現在使えるお金",
        description:
          "現在使えるお金セクションで手持ちの金額を入力すると、支出を差し引いた残額が自動計算されます。",
      },
    ],
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    let timeoutId = null;

    try {
      const storedVersion = window.localStorage.getItem(tutorialStorageKey);
      if (storedVersion === TUTORIAL_VERSION) {
        setIsTutorialVisible(false);
      } else {
        timeoutId = window.setTimeout(() => {
          setIsTutorialVisible(true);
        }, 300);
      }
    } catch (error) {
      console.warn("チュートリアルの表示状態を確認できませんでした", error);
      timeoutId = window.setTimeout(() => {
        setIsTutorialVisible(true);
      }, 300);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [tutorialStorageKey]);

  const handleTutorialClose = useCallback(() => {
    setIsTutorialVisible(false);
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(tutorialStorageKey, TUTORIAL_VERSION);
    } catch (error) {
      console.warn("チュートリアルの表示状態を保存できませんでした", error);
    }
  }, [tutorialStorageKey]);

  useEffect(() => {
    let isMounted = true;

    const currentYearNumber = new Date().getFullYear();
    const defaultYears = buildYearRange(currentYearNumber, currentYearNumber);

    const loadYearOptions = async () => {
      if (!user?.id) {
        if (isMounted) {
          setYearOptions(defaultYears);
          setSelectedYear((prev) =>
            defaultYears.includes(prev) && prev
              ? prev
              : defaultYears[0] ?? getCurrentYear()
          );
        }
        return;
      }

      try {
        const [
          { data: earliestRow, error: earliestError },
          { data: latestRow, error: latestError },
        ] = await Promise.all([
          supabase
            .from("expenses")
            .select("expense_date")
            .eq("user_id", user.id)
            .order("expense_date", { ascending: true })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("expenses")
            .select("expense_date")
            .eq("user_id", user.id)
            .order("expense_date", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (earliestError) {
          throw earliestError;
        }

        if (latestError) {
          throw latestError;
        }

        const earliestYear =
          extractYear(earliestRow?.expense_date) ?? currentYearNumber;
        const latestYear =
          extractYear(latestRow?.expense_date) ?? currentYearNumber;
        const options = buildYearRange(
          earliestYear,
          latestYear ?? currentYearNumber
        );

        if (isMounted) {
          setYearOptions(options.length > 0 ? options : defaultYears);
          setSelectedYear((prev) => {
            const source = options.length > 0 ? options : defaultYears;
            return source.includes(prev) && prev
              ? prev
              : source[0] ?? getCurrentYear();
          });
        }
      } catch (loadError) {
        console.error("年選択肢の取得に失敗しました", loadError);
        if (isMounted) {
          setYearOptions(defaultYears);
          setSelectedYear((prev) =>
            defaultYears.includes(prev) && prev
              ? prev
              : defaultYears[0] ?? getCurrentYear()
          );
        }
      }
    };

    loadYearOptions();

    return () => {
      isMounted = false;
    };
  }, [user?.id, expensesVersion]);

  return (
    <div>
      <header>
        <h1 className="text-3xl text-center pt-4 font-bold">ReceiptNote</h1>
      </header>
      <main>
        <MonthSelector
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonth}
          yearOptions={yearOptions}
        />
        <CardList
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          user={user}
          onExpensesMutated={handleExpensesMutated}
        />
        <hr className="mx-6 mt-8 border-t border-gray-400" aria-hidden="true" />
        <AvailableFunds
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          userId={user?.id ?? null}
          expensesVersion={expensesVersion}
        />
        <TutorialGuide
          show={isTutorialVisible}
          steps={tutorialSteps}
          onClose={handleTutorialClose}
        />
      </main>
      {onLogout && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-gray-500 underline underline-offset-2 transition hover:text-gray-700"
          >
            ログアウト
          </button>
        </div>
      )}
      <footer>
        <p className="text-center mt-10">
          &copy; 2025 Kobutaemon All Right Reserved.
        </p>
      </footer>
    </div>
  );
}

export default Dashboard;
