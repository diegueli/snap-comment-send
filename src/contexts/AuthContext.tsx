
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { secureLogger } from '@/utils/secureLogger';
import { handleAsyncError, createUserFriendlyError } from '@/utils/errorHandler';

export interface Profile {
  id: string;
  name: string;
  position: string;
  gerencia_id?: number;
  can_view_all_auditorias?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: { name: string; position: string; gerencia_id?: number }) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Configurar listener de cambios de autenticación primero
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      secureLogger.info('Auth state changed', { event });
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Usar setTimeout para evitar deadlock
        setTimeout(() => {
          loadProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Luego verificar sesión existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      secureLogger.info('Initial session check completed');
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const profileQuery = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const [result, error] = await handleAsyncError(
      profileQuery,
      'loadProfile'
    );

    if (error) {
      toast({
        title: "Error al cargar perfil",
        description: "No se pudo cargar la información del perfil.",
        variant: "destructive",
      });
    } else if (result?.data) {
      setProfile(result.data as Profile);
      secureLogger.info('Profile loaded successfully');
    }
    
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    secureLogger.info('Sign in attempt started');
    
    const [data, error] = await handleAsyncError(
      supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      }),
      'signIn'
    );

    if (error) {
      toast({
        title: "Error al iniciar sesión",
        description: error.message,
        variant: "destructive",
      });
      throw new Error(error.message);
    } else {
      secureLogger.info('Sign in successful');
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente.",
      });
    }
    
    setLoading(false);
  };

  const signUp = async (email: string, password: string, userData: { name: string; position: string; gerencia_id?: number }) => {
    setLoading(true);
    secureLogger.info('Sign up attempt started');
    
    // Configurar URL de redirección
    const redirectUrl = `${window.location.origin}/`;
    
    const [data, error] = await handleAsyncError(
      supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: userData.name,
            position: userData.position,
            gerencia_id: userData.gerencia_id?.toString(),
          },
        },
      }),
      'signUp'
    );

    if (error) {
      toast({
        title: "Error al registrarse",
        description: error.message,
        variant: "destructive",
      });
      throw new Error(error.message);
    } else {
      secureLogger.info('Sign up successful');
      toast({
        title: "¡Cuenta creada!",
        description: "Tu cuenta ha sido creada exitosamente. Revisa tu email para confirmar tu cuenta.",
      });
    }
    
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    secureLogger.info('Sign out attempt started');
    
    const [data, error] = await handleAsyncError(
      supabase.auth.signOut(),
      'signOut'
    );

    if (error) {
      toast({
        title: "Error al cerrar sesión",
        description: "Hubo un problema al cerrar la sesión.",
        variant: "destructive",
      });
      throw new Error(error.message);
    } else {
      secureLogger.info('Sign out successful');
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      });
    }
    
    setLoading(false);
  };

  const value = {
    user,
    profile,
    signIn,
    signUp,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
