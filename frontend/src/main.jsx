import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { ContextProvider } from './context/AuthContext.jsx';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom'
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <StrictMode>
   <ContextProvider>
     <App />
   </ContextProvider>
  </StrictMode>
  </BrowserRouter>
)
