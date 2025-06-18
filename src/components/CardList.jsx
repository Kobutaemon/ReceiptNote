import React from "react";
import Card from "./Card";

function CardList() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 mt-10">
      <Card svgName="bicycle" cardTitle="駐輪代" cardTotal="¥2,000" />
      <Card svgName="shopping" cardTitle="買い物代" cardTotal="¥15,000" />
      <Card svgName="something" cardTitle="その他" cardTotal="¥3,500" />
    </div>
  );
}

export default CardList;
