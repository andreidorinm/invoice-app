const FileUploadButton = ({ openDialog }: any) => (
  <div className="flex justify-center py-2">
    <button
      onClick={openDialog}
      className="px-10 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none transition duration-150 ease-in-out"
    >
      Selectează fișierul XML ANAF
    </button>
  </div>
);

export default FileUploadButton;
