import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux'
import store from './store'
import axios from 'axios'

// Backend authenticates via httpOnly cookie, so always send credentials
axios.defaults.withCredentials = true

createRoot(document.getElementById('root')).render(

  <Provider store={store} >
    <App />
  </Provider>

)