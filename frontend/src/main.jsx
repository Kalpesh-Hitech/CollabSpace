import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './redux/store.jsx'
import { injectStore } from './redux/slices/authSlice.jsx'
import './index.css'
import App from './App.jsx'

// Inject store into the axios interceptor immediately after store is created.
// This avoids the globalThis timing race with PersistGate rehydration.
injectStore(store)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>,
)