import Card from "./Card";

function CardList({ selectedMonth }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 mt-10">
      <Card
        svgName="bicycle"
        svgColor="blue"
        cardTitle="駐輪代"
        selectedMonth={selectedMonth}
      />
      <Card
        svgName="shopping"
        svgColor="purple"
        cardTitle="買い物代"
        selectedMonth={selectedMonth}
      />
      <Card
        svgName="rittyan"
        svgColor="green"
        cardTitle="交際費(代)"
        selectedMonth={selectedMonth}
      />
      <Card
        svgName="something"
        svgColor="gray"
        cardTitle="その他"
        selectedMonth={selectedMonth}
      />
    </div>
  );
}

export default CardList;
