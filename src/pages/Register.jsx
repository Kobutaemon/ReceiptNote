import { useState } from "react";
import { getTodayDateJP } from "../utils/dateUtils";
import { btnColorMap } from "../utils/colorMap";
import { supabase } from "../lib/supabaseClient";

function Register({ btnColor, category, user }) {
  const todayDate = getTodayDateJP();
  const btnBgColor = btnColorMap[btnColor];

  // 以下Supabaseのための定義
  const [price, setPrice] = useState();
  const [registrationDate, setRegistrationDate] = useState(todayDate);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // userが渡されていない場合は処理を中断(安全対策)
    if (!user) {
      alert("エラー: ユーザー情報がありません。");
      return;
    }
    setLoading(true);

    const { error } = await supabase.from("expenses").insert({
      user_id: user.id,
      expense_date: registrationDate,
      price: parseInt(price, 10),
      category: category,
      description: description,
    });

    if (error) {
      alert("エラーが発生 : " + error.message);
    } else {
      alert("登録完了！");
      // フォームをリセット
      setPrice("");
      setDescription("");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-20 items-center h-140">
      <h2 className="text-3xl text-center font-bold pt-8">{category} 登録</h2>
      <form
        action="#"
        className="flex flex-col gap-10 w-60 mx-auto"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="date">
            <span className="text-red-400">*</span>日付
          </label>
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
          <label htmlFor="price">
            <span className="text-red-400">*</span>金額
          </label>
          <input
            type="number"
            name="price"
            id="price"
            className="p-2 bg-white rounded outline-0 border-2 border-gray-300"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            required
          />
        </div>
        <div>
          <label htmlFor="description">説明(任意)</label>
          <textarea
            name="description"
            id="description"
            rows="3"
            className="p-2 bg-white rounded outline-0 border-2 border-gray-300 resize-none w-[100%]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="(例) オーケー行って牛乳とか買った"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`self-end py-2 px-4 rounded text-white cursor-pointer ${btnBgColor}`}
        >
          {loading ? "登録中..." : "登録"}
        </button>
      </form>
    </div>
  );
}

export default Register;
