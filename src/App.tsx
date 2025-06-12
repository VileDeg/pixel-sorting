import { useState } from 'react'

import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

import './App.css'

import { PixelSorter } from './components/pixelSorter/pixelSorter.tsx'
import { UploadPage } from './components/uploadPage/uploadPage.tsx'

const App = () => {
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const onUpload = (file: File) => {
    setImageFile(file);
  }

  const onGoBack = () => {
    setImageFile(null);
  }

  return (
    <div>
      {imageFile != null ? (
        <PixelSorter imageFile={imageFile} onGoBack={onGoBack} />
      ) : (
        <UploadPage onUpload={onUpload} />
      )
      }
    </div>
  );
};


export default App
