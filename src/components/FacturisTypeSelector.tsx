const FacturisTypeSelector = ({ facturisType, handleFacturisTypeChange }: any) => (
  <div>
    <h3 className="text-xl font-semibold mb-2 text-black">
      Tipul de Facturis
    </h3>
    <div className="flex space-x-2">
      {['facturis desktop', 'facturis online'].map((type) => (
        <button
          key={type}
          onClick={() => handleFacturisTypeChange(type)}
          className={`flex-1 button-facturis-type py-4 rounded-lg ${facturisType === type ? 'bg-blue-500 text-white' : 'bg-gray-200'
            } transition duration-150 ease-in-out`}
        >
          {type === 'facturis desktop' ? 'Desktop' : 'Online'}
        </button>
      ))}
    </div>
  </div>
);

export default FacturisTypeSelector
