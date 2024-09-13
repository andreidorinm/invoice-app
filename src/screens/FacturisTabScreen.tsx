import FacturisTypeSelector from "../components/FacturisTypeSelector";
import FileUploadButton from "../components/FileUploadButton";
import GhidRapid from "../components/GhidRapid";
import MarkupAdjuster from "../components/MarkupAdjuster";
import VatPayerToggle from "../components/VatPayerToggle";

const FacturisTabScreen = ({
  facturisType,
  handleFacturisTypeChange,
  isVatPayer,
  handleToggleVatPayerStatus,
  markup,
  handleMarkupChange,
  handleBlurMarkup,
  increaseMarkup,
  decreaseMarkup,
  openDialog,
  loading,
}: any) => (
  <>
    <GhidRapid />
    <main className="flex-grow p-6 bg-white m-4 rounded-lg shadow-lg">
      <div className="space-y-6">
        <FacturisTypeSelector
          facturisType={facturisType}
          handleFacturisTypeChange={handleFacturisTypeChange}
        />
        <VatPayerToggle
          isVatPayer={isVatPayer}
          handleToggleVatPayerStatus={handleToggleVatPayerStatus}
        />
        <MarkupAdjuster
          markup={markup}
          handleMarkupChange={handleMarkupChange}
          handleBlurMarkup={handleBlurMarkup}
          increaseMarkup={increaseMarkup}
          decreaseMarkup={decreaseMarkup}
          loading={loading}
        />
        <FileUploadButton openDialog={openDialog} />
      </div>
    </main>
  </>
);

export default FacturisTabScreen
