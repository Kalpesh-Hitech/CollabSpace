import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import authReducer from './slices/authSlice'

const persistConfig = { key: 'cs_root', version: 1, storage, whitelist: ['auth'] }
const rootReducer   = combineReducers({ auth: authReducer })
const persisted     = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persisted,
  middleware: gDM => gDM({ serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] } }),
  devTools: import.meta.env.DEV,
})
export const persistor = persistStore(store)