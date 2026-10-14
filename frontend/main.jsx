import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux'
import store from './store'
import axios from 'axios'
import { loadUser, restoreAuthToken } from './actions/userActions'

// Always send cookies with API requests
axios.defaults.withCredentials = true

// Re-attach the saved login token, then restore the session on every page load/refresh
restoreAuthToken()
store.dispatch(loadUser())

createRoot(document.getElementById('root')).render(

  <Provider store={store} >
    <App />
  </Provider>

)