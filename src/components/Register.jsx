import { useState } from "react";
import { getTodayDateJP } from "../utils/dateUtils";

function Register() {
  const todayDate = getTodayDateJP();
  console.log("今日の日付:", todayDate); // 2025/06/18の形式で出力
  const [registrationDate, setRegistrationDate] = useState(todayDate);

  return (
    <form action="#">
      <label htmlFor="date">日付</label>
      <input
        type="date"
        name="date"
        id="date"
        value={registrationDate}
        onChange={(e) => setRegistrationDate(e.target.value)}
      />
      <p>今日の日付: {todayDate}</p>
    </form>
  );
}

export default Register;
