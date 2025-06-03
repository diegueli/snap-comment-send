
import { useState, useCallback } from 'react';
import { CapturedPhoto, PhotoSet, UserData, AuditoriaFormData, AuditoriaData, Planta } from '@/types/auditoria';

export const useAuditoriaState = () => {
  const [auditoriaData, setAuditoriaData] = useState<AuditoriaData | null>(null);
  const [selectedPlanta, setSelectedPlanta] = useState<Planta | null>(null);
  const [currentPhotos, setCurrentPhotos] = useState<CapturedPhoto[]>([]);
  const [currentArea, setCurrentArea] = useState('');
  const [currentLevantamiento, setCurrentLevantamiento] = useState('');
  const [currentResponsable, setCurrentResponsable] = useState('');
  const [currentResponsableId, setCurrentResponsableId] = useState<number | null>(null);
  const [photoSets, setPhotoSets] = useState<PhotoSet[]>([]);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingLevantamiento, setEditingLevantamiento] = useState('');
  const [editingResponsable, setEditingResponsable] = useState('');
  const [editingResponsableId, setEditingResponsableId] = useState<number | null>(null);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editingArea, setEditingArea] = useState('');
  const [showAreaInput, setShowAreaInput] = useState(false);
  const [codigoAuditoria, setCodigoAuditoria] = useState<string | null>(null);
  const [isSavingToDatabase, setIsSavingToDatabase] = useState(false);
  const [areaCounter, setAreaCounter] = useState(1);

  const getNumberedArea = useCallback((area: string) => {
    const numberedArea = `${areaCounter}-${area}`;
    setAreaCounter(prev => prev + 1);
    return numberedArea;
  }, [areaCounter]);

  const resetState = useCallback(() => {
    setAuditoriaData(null);
    setSelectedPlanta(null);
    setCurrentPhotos([]);
    setCurrentArea('');
    setCurrentLevantamiento('');
    setCurrentResponsable('');
    setCurrentResponsableId(null);
    setPhotoSets([]);
    setEditingSetId(null);
    setEditingLevantamiento('');
    setEditingResponsable('');
    setEditingResponsableId(null);
    setEditingAreaId(null);
    setEditingArea('');
    setShowAreaInput(false);
    setCodigoAuditoria(null);
    setIsSavingToDatabase(false);
    setAreaCounter(1);
  }, []);

  return {
    // State
    auditoriaData,
    selectedPlanta,
    currentPhotos,
    currentArea,
    currentLevantamiento,
    currentResponsable,
    currentResponsableId,
    photoSets,
    editingSetId,
    editingLevantamiento,
    editingResponsable,
    editingResponsableId,
    editingAreaId,
    editingArea,
    showAreaInput,
    codigoAuditoria,
    isSavingToDatabase,
    areaCounter,
    // Setters
    setAuditoriaData,
    setSelectedPlanta,
    setCurrentPhotos,
    setCurrentArea,
    setCurrentLevantamiento,
    setCurrentResponsable,
    setCurrentResponsableId,
    setPhotoSets,
    setEditingSetId,
    setEditingLevantamiento,
    setEditingResponsable,
    setEditingResponsableId,
    setEditingAreaId,
    setEditingArea,
    setShowAreaInput,
    setCodigoAuditoria,
    setIsSavingToDatabase,
    setAreaCounter,
    // Actions
    resetState,
    getNumberedArea
  };
};
