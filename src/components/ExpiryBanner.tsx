const ExpiryBanner = ({ expiryDate, calculateTimeLeft }: any) => (
  <div className="fixed right-0 bottom-0 p-4 space-y-2">
    <span className="block text-right text-sm text-white bg-gray-800 p-2 rounded">
      Licenta expira pe data: {expiryDate}
    </span>
    <span className="block text-right text-sm text-white bg-gray-800 p-2 rounded">
      {calculateTimeLeft()}
    </span>
  </div>
);

export default ExpiryBanner
