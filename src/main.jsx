import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initBilling } from '@/lib/billing'

// Warm the billing cache before rendering so feature gates are correct on first render
initBilling().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  )
})