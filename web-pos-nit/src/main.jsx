import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './locales/i18n'

import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
  },
  onOfflineReady() {
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
