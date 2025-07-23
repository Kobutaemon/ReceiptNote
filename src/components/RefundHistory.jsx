function RefundHistory() {
  return (
    <div className="grid grid-cols-3 grid-rows-5 gap-4 border border-gray-500 bg-white w-72 h-52 p-6 rounded-2xl">
      <div className="row-span-5">
        <input
          type="checkbox"
          name="isRefund"
          id="isRefund"
          className="w-6 h-6"
        />
      </div>
      <div className="col-span-2">
        <h3>2025年 7月</h3>
      </div>
      <div className="col-span-2 row-span-4 col-start-2 row-start-2">
        <div className="flex justify-between">
          <span>〇〇代</span>
          <span>□□円</span>
        </div>
      </div>
    </div>
  );
}

export default RefundHistory;
