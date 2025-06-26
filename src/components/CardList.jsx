import Card from "./Card";

function CardList() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 mt-10">
      <Card svgName="bicycle" svgColor="blue" cardTitle="駐輪代" />
      <Card svgName="shopping" svgColor="green" cardTitle="買い物代" />
      <Card svgName="something" svgColor="gray" cardTitle="その他" />
    </div>
  );
}

export default CardList;
