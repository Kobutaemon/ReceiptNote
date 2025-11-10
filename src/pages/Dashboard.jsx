import { useCallback, useState } from "react";
import CardList from "../components/CardList";
import MonthSelector from "../components/MonthSelector";
import AvailableFunds from "../components/AvailableFunds";
import { getCurrentMonth } from "../utils/dateUtils";

function Dashboard({ user, onLogout }) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [expensesVersion, setExpensesVersion] = useState(0);

  const handleExpensesMutated = useCallback(() => {
    setExpensesVersion((prev) => prev + 1);
  }, []);

  return (
    <div>
      <header>
        <h1 className="text-3xl text-center pt-4 font-bold">ReceiptNote</h1>
      </header>
      <main>
        <AvailableFunds
          selectedMonth={selectedMonth}
          userId={user?.id ?? null}
          expensesVersion={expensesVersion}
        />
        <MonthSelector
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
        <CardList
          selectedMonth={selectedMonth}
          user={user}
          onExpensesMutated={handleExpensesMutated}
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
