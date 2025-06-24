import React from "react";
import Register from "../components/Register";

function Shopping() {
  return (
    <div>
      <div>
        <h2 className="text-3xl text-center font-bold pt-8">買い物代 登録</h2>
      </div>
      <Register btnColor="green" />
    </div>
  );
}

export default Shopping;
