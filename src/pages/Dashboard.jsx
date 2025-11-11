import { useCallback, useEffect, useState } from "react";
import CardList from "../components/CardList";
import MonthSelector from "../components/MonthSelector";
import AvailableFunds from "../components/AvailableFunds";
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

  const handleExpensesMutated = useCallback(() => {
    setExpensesVersion((prev) => prev + 1);
  }, []);

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
