import ExcelIcon from '../assets/excel.ico'
import TabButton from './TabButton';

const Header = ({ activeTab, handleTabClick }: any) => (
  <header className="p-4 bg-blue-600 text-white">
    <div className="container mx-auto flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <img src={ExcelIcon} width={40} alt="Excel Icon" />
        <h1 className="text-3xl font-bold tracking-wide">ClarFactura in NIR</h1>
      </div>

      <div className="flex-1 flex flex-col items-center">
        <p className="text-sm font-medium">Te rog alege tipul de program:</p>
        <div className="flex space-x-2 mt-2">
          {['facturis', 'freya', 'oblio', 'smartbill'].map((tab) => (
            <TabButton
              key={tab}
              tab={tab}
              activeTab={activeTab}
              handleTabClick={handleTabClick}
            />
          ))}
        </div>
      </div>
    </div>
  </header>
);

export default Header;
