import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { PixelSorter } from './components/pixelSorter/pixelSorter.tsx'

const App = () => {
  return (
    <div>
      <PixelSorter />
    </div>
  );
};


export default App
