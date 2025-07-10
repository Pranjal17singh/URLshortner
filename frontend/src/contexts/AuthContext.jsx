import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          if (isMounted) setLoading(false);
          return;
        }
        
        if (session?.user && isMounted) {
          await getProfile(session.user);
        } else if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) setLoading(false);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      if (event === 'SIGNED_IN' && session?.user) {
        await getProfile(session.user);
      } else if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setLoading(false);
      }
    });

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [])

  const getProfile = async (authUser) => {
    try {
      // Try to fetch user profile from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      const userData = {
        id: authUser.id,
        email: authUser.email,
        firstName: profile?.first_name || authUser.user_metadata?.first_name || '',
        lastName: profile?.last_name || authUser.user_metadata?.last_name || ''
      };

      setUser(userData);
    } catch (error) {
      console.error('Get profile error:', error);
      // Fallback to auth user data
      setUser({
        id: authUser.id,
        email: authUser.email,
        firstName: authUser.user_metadata?.first_name || '',
        lastName: authUser.user_metadata?.last_name || ''
      });
    } finally {
      setLoading(false);
    }
  }

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        toast.error(error.message)
        return { success: false, error: error.message }
      }

      toast.success('Login successful!')
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login failed')
      return { success: false, error: 'Login failed' }
    }
  }

  const register = async (userData) => {
    try {
      console.log('Starting registration with:', userData)
      const { firstName, lastName, email, password } = userData

      console.log('Calling supabase.auth.signUp...')
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      })

      console.log('Supabase signUp result:', { data, error })

      if (error) {
        console.error('Supabase auth error:', error)
        toast.error(error.message)
        return { success: false, error: error.message }
      }

      toast.success('Registration successful! Please check your email for verification.')
      return { success: true }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Registration failed: ' + error.message)
      return { success: false, error: 'Registration failed: ' + error.message }
    }
  }

  const loginWithToken = async (token, userData) => {
    // This method is for OAuth callbacks
    try {
      setUser(userData)
      return { success: true }
    } catch (error) {
      console.error('Token login error:', error)
      return { success: false, error: 'Failed to authenticate with token' }
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed')
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    loginWithToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}