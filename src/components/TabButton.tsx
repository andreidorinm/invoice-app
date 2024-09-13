const TabButton = ({ tab, activeTab, handleTabClick }: any) => {
  const tabNames: any = {
    facturis: 'Facturis',
    freya: 'Freya',
    oblio: 'Oblio',
    smartbill: 'Smartbill',
  };

  return (
    <button
      className={`px-4 py-2 rounded transition-all duration-300 shadow-sm ${activeTab === tab
        ? 'bg-green-600 text-white'
        : 'bg-gray-200 text-black hover:bg-green-500 hover:text-white'
        }`}
      onClick={() => handleTabClick(tab)}
    >
      {tabNames[tab]}
    </button>
  );
};

export default TabButton
