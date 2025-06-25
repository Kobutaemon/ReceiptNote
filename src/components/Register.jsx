import { useState } from "react";
import { getTodayDateJP } from "../utils/dateUtils";
import { btnColorMap } from "../utils/colorMap";

function Register({ btnColor }) {
  const todayDate = getTodayDateJP();
  const btnBgColor = btnColorMap[btnColor];

  const [registrationDate, setRegistrationDate] = useState(todayDate);
  const [price, setPrice] = useState(0);

  return (
    <div className="flex items-center h-140">
      <form action="#" className="flex flex-col gap-10 w-60 mx-auto">
        <div className="flex flex-col gap-2">
          <label htmlFor="date">日付</label>
          <input
            type="date"
            name="date"
            id="date"
            className="p-2 bg-white rounded outline-0 border-2 border-gray-300"
            value={registrationDate}
            onChange={(e) => setRegistrationDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="price">金額</label>
          <input
            type="price"
            name="price"
            id="price"
            className="p-2 bg-white rounded outline-0 border-2 border-gray-300"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
          />
        </div>
        <button
          className={`self-end py-2 px-4 rounded text-white cursor-pointer ${btnBgColor}`}
        >
          登録
        </button>
      </form>
    </div>
  );
}

export default Register;
