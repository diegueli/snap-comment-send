
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
      console.log('Auth state changed:', event, session?.user?.email);
      
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
      console.log('Initial session:', session?.user?.email);
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
    try {
      console.log('Loading profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        throw error;
      }
      
      console.log('Profile loaded:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error al cargar perfil",
        description: "No se pudo cargar la información del perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      console.log('Sign in successful:', data.user?.email);
      
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente.",
      });
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      let errorMessage = "Error al iniciar sesión";
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Credenciales incorrectas. Verifica tu email y contraseña.";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "Por favor confirma tu email antes de iniciar sesión.";
      }
      
      toast({
        title: "Error al iniciar sesión",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: { name: string; position: string; gerencia_id?: number }) => {
    try {
      setLoading(true);
      console.log('Attempting sign up for:', email, userData);
      
      // Configurar URL de redirección
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
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
      });

      if (error) {
        console.error('Sign up error:', error);
        throw error;
      }

      console.log('Sign up successful:', data.user?.email);
      
      toast({
        title: "¡Cuenta creada!",
        description: "Tu cuenta ha sido creada exitosamente. Revisa tu email para confirmar tu cuenta.",
      });
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      let errorMessage = "Error al registrarse";
      if (error.message?.includes('User already registered')) {
        errorMessage = "Este email ya está registrado. Intenta iniciar sesión.";
      } else if (error.message?.includes('Password should be at least 6 characters')) {
        errorMessage = "La contraseña debe tener al menos 6 caracteres.";
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = "El formato del email no es válido.";
      }
      
      toast({
        title: "Error al registrarse",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('Signing out user');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      console.log('Sign out successful');
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Error al cerrar sesión",
        description: "Hubo un problema al cerrar la sesión.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
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
