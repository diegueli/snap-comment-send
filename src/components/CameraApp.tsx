
import React, { useState } from 'react';
import AuditoriaForm from './AuditoriaForm';
import CameraSetForm from './CameraSetForm';

interface CameraAppProps {
  onClose: () => void;
  userData: {
    auditoriaId: string;
    name: string;
    email: string;
    position: string;
  };
}

interface AuditoriaData {
  tituloDocumento: string;
  fecha: string;
  auditor: string;
  plantaId: number;
  plantaNombre: string;
}

const CameraApp: React.FC<CameraAppProps> = ({ onClose, userData }) => {
  const [auditoriaData, setAuditoriaData] = useState<AuditoriaData | null>(null);

  const handleAuditoriaSubmit = (data: AuditoriaData) => {
    setAuditoriaData(data);
  };

  const handleBackToForm = () => {
    setAuditoriaData(null);
  };

  return (
    <>
      {!auditoriaData ? (
        <AuditoriaForm 
          onSubmit={handleAuditoriaSubmit} 
          userData={userData}
        />
      ) : (
        <CameraSetForm 
          onClose={onClose}
          userData={userData}
          auditoriaData={auditoriaData}
          onBack={handleBackToForm}
        />
      )}
    </>
  );
};

export default CameraApp;
