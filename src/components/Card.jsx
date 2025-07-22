import { useState, useEffect } from "react";
import { Bike, ShoppingBag, Ellipsis } from "lucide-react";
import { svgColorMap } from "../utils/colorMap";
import { supabase } from "../lib/supabaseClient";

function Card({ svgName, svgColor, cardTitle, selectedMonth }) {
  const [cardTotal, setCardTotal] = useState(0);

  useEffect(() => {
    const fetchTotal = async () => {
      // デバッグ: どのカテゴリのデータを取得しようとしているか確認
      console.log(
        `Fetching total for category: ${cardTitle}, month: ${selectedMonth}`
      );

      // 選択された月の年を取得（現在年を使用）
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-${selectedMonth}-01`;

      // 月の最終日を取得
      const nextMonth =
        selectedMonth === "12"
          ? "01"
          : String(parseInt(selectedMonth) + 1).padStart(2, "0");
      const nextYear = selectedMonth === "12" ? currentYear + 1 : currentYear;
      const endDate = `${nextYear}-${nextMonth}-01`;

      // 'category'カラムがcardTitleと一致し、expense_dateが選択月の範囲内の行の'price'カラムを取得
      const { data, error } = await supabase
        .from("expenses")
        .select("price")
        .eq("category", cardTitle)
        .gte("expense_date", startDate)
        .lt("expense_date", endDate);

      // デバッグ: エラーが発生していないか確認
      if (error) {
        console.error(`Error fetching data for ${cardTitle}:`, error);
        return;
      }

      // デバッグ: 取得したデータの内容を確認
      console.log(`Data received for ${cardTitle} in ${selectedMonth}:`, data);

      // 取得した'price'の合計を計算 (priceがnullやundefinedの場合も考慮)
      const total = data.reduce((acc, item) => acc + (item.price || 0), 0);

      // デバッグ: 計算された合計金額を確認
      console.log(`Calculated total for ${cardTitle}: ${total}`);

      const formattedTotal = new Intl.NumberFormat("ja-JP").format(total);
      setCardTotal(formattedTotal);
    };

    fetchTotal();
  }, [selectedMonth]);

  // アイコン名をコンポーネントにマッピング
  const iconMap = {
    bicycle: Bike,
    shopping: ShoppingBag,
    something: Ellipsis,
  };

  // 指定されたアイコンを取得（存在しない場合はEllipsisをデフォルト）
  const IconComponent = iconMap[svgName] || Ellipsis;
  // 指定されたカラーを取得（存在しない場合はtransparent(透明)をデフォルト）
  const colorComponent = svgColorMap[svgColor] || "transparent";

  return (
    <div className="bg-white rounded-lg border border-black p-6">
      <div className="flex items-center gap-4">
        <div className={`p-2 ${colorComponent["bg"]} rounded`}>
          <IconComponent size={24} className={colorComponent["text"]} />
        </div>
        <div>
          <p className="text-sm text-gray-600">{cardTitle}</p>
          <h3 className="text-xl font-bold text-gray-900">{cardTotal}円</h3>
        </div>
      </div>
    </div>
  );
}

export default Card;
