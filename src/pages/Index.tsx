
import { useAuth } from "@/contexts/AuthContext";
import AuthForm from "@/components/AuthForm";
import MainApp from "@/components/MainApp";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-red-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar el formulario de autenticación
  if (!user) {
    return <AuthForm />;
  }

  // Si hay usuario autenticado, mostrar la aplicación principal
  return <MainApp />;
};

export default Index;
