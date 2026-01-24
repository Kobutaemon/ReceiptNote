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

function Dashboard({ user }) {
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
      const currentYearString = getCurrentYear();

      if (!user?.id) {
        if (isMounted) {
          setYearOptions(defaultYears);
          setSelectedYear((prev) => {
            if (defaultYears.includes(currentYearString)) {
              return currentYearString;
            }
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
        const endYear = Math.max(latestYear, currentYearNumber);
        const options = buildYearRange(earliestYear, endYear);

        if (isMounted) {
          setYearOptions(options.length > 0 ? options : defaultYears);
          setSelectedYear((prev) => {
            const source = options.length > 0 ? options : defaultYears;
            if (source.includes(currentYearString)) {
              return currentYearString;
            }
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
            if (defaultYears.includes(currentYearString)) {
              return currentYearString;
            }
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
  );
}

export default Dashboard;
