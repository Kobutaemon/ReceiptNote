import CardList from "../components/CardList";
import MonthSelector from "../components/MonthSelector";
import { getCurrentMonth } from "../utils/dateUtils";
import { useState } from "react";

function Dashboard({ user }) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  return (
    <div>
      <header>
        <h1 className="text-3xl text-center pt-4 font-bold">ReceiptNote</h1>
      </header>
      <main>
        <MonthSelector
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
        <CardList selectedMonth={selectedMonth} user={user} />
      </main>
      <footer>
        <p className="text-center mt-10">
          &copy; 2025 Kobutaemon All Right Reserved.
        </p>
      </footer>
    </div>
  );
}

export default Dashboard;
