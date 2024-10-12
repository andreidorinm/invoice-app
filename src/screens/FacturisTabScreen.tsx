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
}: any) => {

  const facturisSteps = [
    { icon: '🔧', text: 'Setează Tipul Facturis (Desktop sau Online)' },
    { icon: '💼', text: 'Pune un status plătitor sau neplătitor TVA' },
    { icon: '💹', text: 'Ajustează Procentajul de Adaos Comercial și confirmă.' },
    { icon: '📤', text: 'Încarcă fișierul XML sau ZIP pentru procesare.' },
  ];
  return (
    <>
      <GhidRapid steps={facturisSteps} />
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
}

export default FacturisTabScreen
