import { createRoot } from 'react-dom/client'
import { Routes } from '@generouted/react-router/lazy'
import './index.css'

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(<Routes />)
}
