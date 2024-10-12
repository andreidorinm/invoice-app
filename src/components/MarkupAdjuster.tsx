const MarkupAdjuster = ({
  markup,
  handleMarkupChange,
  handleBlurMarkup,
  increaseMarkup,
  decreaseMarkup,
  loading,
}: any) => (
  <div>
    <label htmlFor="markup" className="block mb-2 text-gray-700">
      Adaos Comercial
    </label>
    <div className="flex justify-center items-center py-2">
      <button
        onClick={decreaseMarkup}
        className="px-3 py-2 bg-gray-200 text-black rounded-l-lg hover:bg-blue-500 focus:outline-none transition duration-150 ease-in-out"
      >
        -
      </button>
      <input
        id="markup"
        type="text"
        className="form-input text-center block w-32 py-2 mr-2 ml-2 border-t rounded border-b border-gray-300 transition duration-150 ease-in-out"
        value={markup}
        onChange={handleMarkupChange}
        onBlur={handleBlurMarkup}
        placeholder="0"
        disabled={loading}
      />
      <button
        onClick={increaseMarkup}
        className="px-3 py-2 bg-gray-200 text-black rounded-r-lg hover:bg-blue-500 focus:outline-none transition duration-150 ease-in-out"
      >
        +
      </button>
    </div>
  </div>
);

export default MarkupAdjuster
