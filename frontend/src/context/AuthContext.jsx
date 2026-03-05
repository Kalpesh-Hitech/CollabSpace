import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types' // Added for S6774

const AuthContext = createContext(null)

const TOKEN_KEY = 'cs_token'
const USER_KEY  = 'cs_user'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null)
  const [user,  setUser]  = useState(() => {
    try { 
      const savedUser = localStorage.getItem(USER_KEY)
      return savedUser ? JSON.parse(savedUser) : null 
    } catch { 
      return null 
    }
  })

  const login = useCallback((tokenValue, userData) => {
    localStorage.setItem(TOKEN_KEY, tokenValue)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setToken(tokenValue)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const authValue = useMemo(() => ({
    token,
    user,
    login,
    logout,
    isAuthenticated: !!token
  }), [token, user, login, logout])

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Fix for S6774: Props Validation
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}