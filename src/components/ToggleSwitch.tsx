const ToggleSwitch = ({ isOn, handleToggle }: any) => {
  return (
    <div className="relative inline-block w-14 mr-2 align-middle select-none transition duration-200 ease-in">
      <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-8 h-8 rounded-full bg-white border-4 appearance-none cursor-pointer" checked={isOn} onChange={handleToggle} />
      <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-8 rounded-full bg-gray-300 cursor-pointer ${isOn ? 'bg-green-500' : 'bg-gray-300'}`}></label>
    </div>
  );
};



export default ToggleSwitch
