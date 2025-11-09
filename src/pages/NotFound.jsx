function NotFound({ onGoHome }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 text-center">
      <h2 className="text-2xl font-semibold text-gray-800">
        指定されたURLのページが存在しません…
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        探し物はここにはないみたい…トップページにあるかも…？
      </p>
      <button
        type="button"
        onClick={onGoHome}
        className="mt-6 rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
      >
        トップページに行く
      </button>
    </div>
  );
}

export default NotFound;
