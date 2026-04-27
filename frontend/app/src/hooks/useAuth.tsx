import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import { getMe, login } from '../services/auth'
import { setAccessToken } from '../services/api'
import type { LoginRequest, UserSummary } from '../types/contracts'

const storageKey = 'focar-lab.crm.token'

interface AuthContextValue {
  isAuthenticated: boolean
  isBootstrapping: boolean
  token: string | null
  user: UserSummary | null
  loginWithPassword: (payload: LoginRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(storageKey))
  const [user, setUser] = useState<UserSummary | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    let isDisposed = false

    if (!token) {
      setAccessToken(null)
      setUser(null)
      setIsBootstrapping(false)
      return
    }

    async function hydrateSession() {
      setAccessToken(token)
      setIsBootstrapping(true)

      try {
        const currentUser = await getMe()

        if (isDisposed) {
          return
        }

        setUser(currentUser)
      } catch {
        if (isDisposed) {
          return
        }

        localStorage.removeItem(storageKey)
        setAccessToken(null)
        setToken(null)
        setUser(null)
      } finally {
        if (!isDisposed) {
          setIsBootstrapping(false)
        }
      }
    }

    void hydrateSession()

    return () => {
      isDisposed = true
    }
  }, [token])

  async function loginWithPassword(payload: LoginRequest) {
    const response = await login(payload)

    localStorage.setItem(storageKey, response.token)
    setAccessToken(response.token)

    startTransition(() => {
      setToken(response.token)
      setUser(response.user)
    })
  }

  function logout() {
    localStorage.removeItem(storageKey)
    setAccessToken(null)
    setToken(null)
    setUser(null)
  }

  const value: AuthContextValue = {
    isAuthenticated: Boolean(token && user),
    isBootstrapping,
    token,
    user,
    loginWithPassword,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
