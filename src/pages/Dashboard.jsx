import { useCallback, useEffect, useState } from "react";
import { Wallet, Users } from "lucide-react";
import CardList from "../components/CardList";
import MonthSelector from "../components/MonthSelector";
import AvailableFunds from "../components/AvailableFunds";
import SplitDashboard from "../components/split/SplitDashboard";
import { getCurrentMonth, getCurrentYear } from "../utils/dateUtils";
import { supabase } from "../lib/supabaseClient";

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
  const [activeTab, setActiveTab] = useState("expenses"); // expenses | split

  const handleExpensesMutated = useCallback(() => {
    setExpensesVersion((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const currentYearNumber = new Date().getFullYear();
    const defaultYears = buildYearRange(currentYearNumber, currentYearNumber);

    const loadYearOptions = async () => {
      const currentYearString = getCurrentYear();

      if (!user?.id) {
        if (isMounted) {
          setYearOptions(defaultYears);
          setSelectedYear((prev) => {
            // 現在の年を優先的に選択
            if (defaultYears.includes(currentYearString)) {
              return currentYearString;
            }
            // 現在の年が選択肢にない場合は、既に選択されている年を維持
            return defaultYears.includes(prev) && prev
              ? prev
              : defaultYears[0] ?? currentYearString;
          });
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
        // 現在の年が常に選択肢に含まれるように、最晚年と現在の年の大きい方を使用
        const endYear = Math.max(latestYear, currentYearNumber);
        const options = buildYearRange(earliestYear, endYear);

        if (isMounted) {
          setYearOptions(options.length > 0 ? options : defaultYears);
          setSelectedYear((prev) => {
            const source = options.length > 0 ? options : defaultYears;
            // 現在の年を優先的に選択
            if (source.includes(currentYearString)) {
              return currentYearString;
            }
            // 現在の年が選択肢にない場合は、既に選択されている年を維持
            return source.includes(prev) && prev
              ? prev
              : source[0] ?? currentYearString;
          });
        }
      } catch (loadError) {
        console.error("年選択肢の取得に失敗しました", loadError);
        if (isMounted) {
          setYearOptions(defaultYears);
          setSelectedYear((prev) => {
            // 現在の年を優先的に選択
            if (defaultYears.includes(currentYearString)) {
              return currentYearString;
            }
            // 現在の年が選択肢にない場合は、既に選択されている年を維持
            return defaultYears.includes(prev) && prev
              ? prev
              : defaultYears[0] ?? currentYearString;
          });
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

      {/* タブナビゲーション */}
      <div className="flex justify-center mt-6">
        <div className="inline-flex rounded-lg bg-gray-200 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("expenses")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "expenses"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Wallet size={18} />
            <span>支出管理</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("split")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "split"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Users size={18} />
            <span>割り勘</span>
          </button>
        </div>
      </div>

      <main>
        {activeTab === "expenses" ? (
          <>
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
          </>
        ) : (
          <SplitDashboard user={user} />
        )}
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

