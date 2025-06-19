import { useState } from "react";
import { getTodayDateJP } from "../utils/dateUtils";

function Register() {
  const todayDate = getTodayDateJP();

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
    </form>
  );
}

export default Register;
