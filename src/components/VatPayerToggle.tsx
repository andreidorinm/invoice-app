import ToggleSwitch from "./ToggleSwitch";

const VatPayerToggle = ({ isVatPayer, handleToggleVatPayerStatus }: any) => (
  <div className="flex items-center justify-center">
    <ToggleSwitch isOn={isVatPayer} handleToggle={handleToggleVatPayerStatus} />
    <span
      className={`ml-3 text-base font-medium ${isVatPayer ? 'text-green-700' : 'text-gray-600'
        }`}
    >
      {isVatPayer ? 'Plătitor de TVA' : 'Neplătitor de TVA'}
    </span>
  </div>
);

export default VatPayerToggle;
