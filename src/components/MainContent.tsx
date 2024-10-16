import MarkupAdjuster from "./MarkupAdjuster";
import ToggleSwitch from "./ToggleSwitch";

const MainContent = ({
  isVatPayer,
  handleToggleVatPayerStatus,
  openDialog,
  title,
  showMarkupAdjuster = false,
}: any) => (
  <main className="flex-grow p-6 bg-white m-4 rounded-lg shadow-lg">
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2 text-black">
          {title}
        </h3>
      </div>

      <div className="flex items-center justify-center">
        <ToggleSwitch
          isOn={isVatPayer}
          handleToggle={handleToggleVatPayerStatus}
        />
        <span
          className={`ml-3 text-base font-medium ${isVatPayer ? 'text-green-700' : 'text-gray-600'
            }`}
        >
          {isVatPayer ? 'Plătitor de TVA' : 'Neplătitor de TVA'}
        </span>
      </div>

      {showMarkupAdjuster && (
        <MarkupAdjuster
        />
      )}

      <div className="flex justify-center py-2">
        <button
          onClick={openDialog}
          className="px-10 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none transition duration-150 ease-in-out"
        >
          Selectează fișierul XML sau ZIP ANAF
        </button>
      </div>
    </div>
  </main>
);

export default MainContent;
