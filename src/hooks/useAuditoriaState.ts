
import { useState, useCallback } from 'react';
import { CapturedPhoto, PhotoSet, UserData, AuditoriaFormData, AuditoriaData, Planta } from '@/types/auditoria';

export const useAuditoriaState = () => {
  const [auditoriaData, setAuditoriaData] = useState<AuditoriaData | null>(null);
  const [selectedPlanta, setSelectedPlanta] = useState<Planta | null>(null);
  const [currentPhotos, setCurrentPhotos] = useState<CapturedPhoto[]>([]);
  const [currentArea, setCurrentArea] = useState('');
  const [currentLevantamiento, setCurrentLevantamiento] = useState('');
  const [currentResponsable, setCurrentResponsable] = useState('');
  const [photoSets, setPhotoSets] = useState<PhotoSet[]>([]);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingLevantamiento, setEditingLevantamiento] = useState('');
  const [editingResponsable, setEditingResponsable] = useState('');
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editingArea, setEditingArea] = useState('');
  const [showAreaInput, setShowAreaInput] = useState(false);
  const [auditoriaId, setAuditoriaId] = useState<string | null>(null);
  const [isSavingToDatabase, setIsSavingToDatabase] = useState(false);

  const resetState = useCallback(() => {
    setAuditoriaData(null);
    setSelectedPlanta(null);
    setCurrentPhotos([]);
    setCurrentArea('');
    setCurrentLevantamiento('');
    setCurrentResponsable('');
    setPhotoSets([]);
    setEditingSetId(null);
    setEditingLevantamiento('');
    setEditingResponsable('');
    setEditingAreaId(null);
    setEditingArea('');
    setShowAreaInput(false);
    setAuditoriaId(null);
    setIsSavingToDatabase(false);
  }, []);

  return {
    // State
    auditoriaData,
    selectedPlanta,
    currentPhotos,
    currentArea,
    currentLevantamiento,
    currentResponsable,
    photoSets,
    editingSetId,
    editingLevantamiento,
    editingResponsable,
    editingAreaId,
    editingArea,
    showAreaInput,
    auditoriaId,
    isSavingToDatabase,
    // Setters
    setAuditoriaData,
    setSelectedPlanta,
    setCurrentPhotos,
    setCurrentArea,
    setCurrentLevantamiento,
    setCurrentResponsable,
    setPhotoSets,
    setEditingSetId,
    setEditingLevantamiento,
    setEditingResponsable,
    setEditingAreaId,
    setEditingArea,
    setShowAreaInput,
    setAuditoriaId,
    setIsSavingToDatabase,
    // Actions
    resetState
  };
};
