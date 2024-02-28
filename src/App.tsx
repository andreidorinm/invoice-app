import './App.css'
import FileProcessor from './components/FileProcessor'
import { LoadingProvider } from './context/LoadingContext'

function App() {
  return (
    <LoadingProvider>
      <div className="relative flex flex-col justify-center overflow-hidden">
        <FileProcessor />
      </div>
    </LoadingProvider>
  )
}

export default App
