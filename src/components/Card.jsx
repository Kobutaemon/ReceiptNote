import React from "react";
import { Bike, ShoppingBag, Ellipsis } from "lucide-react";

function Card({ svgName, svgColor, cardTitle, cardTotal }) {
  // アイコン名をコンポーネントにマッピング
  const iconMap = {
    bicycle: Bike,
    shopping: ShoppingBag,
    something: Ellipsis,
  };

  const color = {
    blue: ["bg-blue-100", "bg-blue-500"],
    green: ["bg-green-100", "bg-green-500"],
    gray: ["bg-gray-100", "black"],
  };

  // 指定されたアイコンを取得（存在しない場合はEllipsisをデフォルト）
  const IconComponent = iconMap[svgName] || Ellipsis;
  // 指定されたカラーを取得（存在しない場合はtransparent(透明)をデフォルト）
  const colorComponent = color[svgColor] || "transparent";

  return (
    <div className="bg-white rounded-lg border border-black p-6 transition-shadow duration-200">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-blue-100 rounded-full">
          <IconComponent size={24} className={`${(<colorComponent />)}`} />
        </div>
        <div>
          <p className="text-sm text-gray-600">{cardTitle}</p>
          <h3 className="text-xl font-bold text-gray-900">{cardTotal}</h3>
        </div>
      </div>
    </div>
  );
}

export default Card;
