import Register from "../components/Register";

function Bicycle() {
  return (
    <div>
      <div>
        <h2 className="text-3xl text-center font-bold pt-8">駐輪代 登録</h2>
      </div>
      <Register btnColor="blue" />
    </div>
  );
}

export default Bicycle;
