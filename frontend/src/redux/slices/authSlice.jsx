import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import toast from 'react-hot-toast'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Store reference injected from main.jsx after store is created
// Avoids circular imports AND the PersistGate rehydration timing problem
let _store = null
export function injectStore(store) { _store = store }

// Token interceptor — reads from injected store
api.interceptors.request.use(cfg => {
  const token = _store?.getState()?.auth?.token
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

const errMsg = e => e.response?.data?.detail || e.message || 'Something went wrong'

/** POST /verifyemail */
export const verifyEmailOtp = createAsyncThunk('verifyEmail', async ({ email, otp }, { rejectWithValue }) => {
  const tid = toast.loading('Verifying OTP…')
  try {
    await api.post('/verifyemail', { email, otp })
    toast.success('Email verified! Please sign in.', { id: tid })
    return true
  } catch (e) {
    toast.error(errMsg(e), { id: tid, duration: 4000 })
    return rejectWithValue(errMsg(e))
  }
})

/**
 * POST /login → then GET /me to get full profile (name, email, role, id)
 * We pass the token directly to /me since the interceptor may not have it yet
 */
export const signinUser = createAsyncThunk('login', async ({ email, password }, { rejectWithValue }) => {
  const tid = toast.loading('Signing you in…')
  try {
    const { data } = await api.post('/login', { email, password })
    const token = data.token

    // Call /me with explicit Bearer header — interceptor not yet updated
    const meRes = await axios.get(`${api.defaults.baseURL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const me = meRes.data   // { id, name, email, role, is_active }

    toast.success(`Welcome back, ${me.name}! 🎉`, { id: tid })
    return {
      token,
      user: {
        id   : me.id,
        name : me.name,
        email: me.email,
        role : me.role,   // "admin" | "manager" | "employee"
      },
    }
  } catch (e) {
    toast.error(errMsg(e), { id: tid, duration: 4000 })
    return rejectWithValue(errMsg(e))
  }
})

/** GET /me — re-sync profile on app load */
export const fetchMe = createAsyncThunk('fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/me')
    return data
  } catch (e) {
    return rejectWithValue(errMsg(e))
  }
})

/** POST /change_password */
export const changePassword = createAsyncThunk('changePassword', async ({ oldPassword, newPassword }, { rejectWithValue }) => {
  const tid = toast.loading('Changing password…')
  try {
    await api.post('/change_password', { old_password: oldPassword, new_password: newPassword })
    toast.success('Password changed!', { id: tid })
    return true
  } catch (e) {
    toast.error(errMsg(e), { id: tid })
    return rejectWithValue(errMsg(e))
  }
})

/** POST /request-change-email */
export const requestEmailOtp = createAsyncThunk('requestEmailOtp', async (_, { rejectWithValue }) => {
  const tid = toast.loading('Sending OTP…')
  try {
    await api.post('/request-change-email')
    toast.success('OTP sent! Check your inbox 📧', { id: tid })
    return true
  } catch (e) {
    toast.error(errMsg(e), { id: tid })
    return rejectWithValue(errMsg(e))
  }
})

/** PUT /change_email */
export const changeEmail = createAsyncThunk('changeEmail', async ({ newEmail, otp }, { rejectWithValue }) => {
  const tid = toast.loading('Changing email…')
  try {
    const { data } = await api.put('/change_email', { email: newEmail, otp })
    toast.success('Email changed!', { id: tid })
    return { email: newEmail, token: data.token }
  } catch (e) {
    toast.error(errMsg(e), { id: tid })
    return rejectWithValue(errMsg(e))
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token       : null,
    user        : null,   // { id, name, email, role }
    pendingEmail: null,
    pendingName : null,
    loading     : false,
    error       : null,
  },
  reducers: {
    logout(state) {
      Object.assign(state, { token: null, user: null, pendingEmail: null, pendingName: null, error: null })
    },
    setPending(state, { payload }) {
      state.pendingEmail = payload.email
      state.pendingName  = payload.name
    },
    clearPending(state) { state.pendingEmail = null; state.pendingName = null },
    clearError(state)   { state.error = null },
    updateUserName(state, { payload }) { if (state.user) state.user.name = payload },
  },
  extraReducers: b => {
    const pend = s      => { s.loading = true;  s.error = null }
    const fail = (s, a) => { s.loading = false; s.error = a.payload }
    b
      .addCase(verifyEmailOtp.pending,   pend)
      .addCase(verifyEmailOtp.fulfilled, s => { s.loading = false })
      .addCase(verifyEmailOtp.rejected,  fail)

      .addCase(signinUser.pending,   pend)
      .addCase(signinUser.fulfilled, (s, { payload }) => {
        s.loading = false; s.token = payload.token; s.user = payload.user
        s.pendingEmail = null; s.pendingName = null
      })
      .addCase(signinUser.rejected, fail)

      // fetchMe — sync full profile without losing token
      .addCase(fetchMe.fulfilled, (s, { payload }) => {
        if (s.user) {
          s.user.id    = payload.id
          s.user.name  = payload.name
          s.user.email = payload.email
          s.user.role  = payload.role
        } else if (payload) {
          // Edge case: user object missing but we have data (shouldn't happen normally)
          s.user = { id: payload.id, name: payload.name, email: payload.email, role: payload.role }
        }
      })

      .addCase(changePassword.pending,   pend)
      .addCase(changePassword.fulfilled, s => { s.loading = false })
      .addCase(changePassword.rejected,  fail)

      .addCase(requestEmailOtp.pending,   pend)
      .addCase(requestEmailOtp.fulfilled, s => { s.loading = false })
      .addCase(requestEmailOtp.rejected,  fail)

      .addCase(changeEmail.pending,   pend)
      .addCase(changeEmail.fulfilled, (s, { payload }) => {
        s.loading = false
        if (s.user) s.user.email = payload.email
        s.token = payload.token
      })
      .addCase(changeEmail.rejected, fail)
  },
})

export const { logout, setPending, clearPending, clearError, updateUserName } = authSlice.actions
export default authSlice.reducer

export const selToken   = s => s.auth.token
export const selUser    = s => s.auth.user
export const selIsAuth  = s => !!s.auth.token
export const selLoading = s => s.auth.loading
export const selError   = s => s.auth.error
export const selPending = s => ({ email: s.auth.pendingEmail, name: s.auth.pendingName })