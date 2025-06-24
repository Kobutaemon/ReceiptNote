import { Bike, ShoppingBag, Ellipsis } from "lucide-react";
import { svgColorMap } from "../utils/colorMap";

function Card({ svgName, svgColor, cardTitle, cardTotal }) {
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
