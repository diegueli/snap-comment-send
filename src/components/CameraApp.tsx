import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { usePhotoActions } from '@/hooks/usePhotoActions';
import { CapturedPhoto, PhotoSet } from '@/types/auditoria';
import { Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface CameraAppProps {
  onClose?: () => void;
  userData?: {
    name: string;
    email: string;
    position: string;
  };
  currentPhotos: CapturedPhoto[];
  setCurrentPhotos: (photos: CapturedPhoto[]) => void;
  setPhotoSets: (sets: PhotoSet[] | ((prev: PhotoSet[]) => PhotoSet[])) => void;
  currentArea: string;
  currentLevantamiento: string;
  currentResponsable: string;
  currentResponsableId: number | null;
  setCurrentArea: (area: string) => void;
  setCurrentLevantamiento: (levantamiento: string) => void;
  setCurrentResponsable: (responsable: string) => void;
  setCurrentResponsableId: (id: number | null) => void;
  showAreaInput: boolean;
  setShowAreaInput: (show: boolean) => void;
  generateNumberedArea: (areaName: string, existingSets: PhotoSet[]) => string;
  stopCamera?: () => void;
}

const CameraApp: React.FC<CameraAppProps> = ({
  onClose,
  userData,
  currentPhotos,
  setCurrentPhotos,
  setPhotoSets,
  currentArea,
  currentLevantamiento,
  currentResponsable,
  currentResponsableId,
  setCurrentArea,
  setCurrentLevantamiento,
  setCurrentResponsable,
  setCurrentResponsableId,
  showAreaInput,
  setShowAreaInput,
  generateNumberedArea,
  stopCamera
}) => {
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingLevantamiento, setEditingLevantamiento] = useState('');
  const [editingResponsable, setEditingResponsable] = useState('');
  const [editingResponsableId, setEditingResponsableId] = useState<number | null>(null);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editingArea, setEditingArea] = useState('');

  const {
    deletePhoto,
    saveCurrentSet,
    deletePhotoSet,
    deletePhotoFromSet,
    updatePhotoSet,
    handleStopCameraWithFewPhotos
  } = usePhotoActions({
    currentPhotos,
    setCurrentPhotos,
    setPhotoSets,
    currentArea,
    currentLevantamiento,
    currentResponsable,
    currentResponsableId,
    setCurrentArea,
    setCurrentLevantamiento,
    setCurrentResponsable,
    setCurrentResponsableId,
    setShowAreaInput,
    generateNumberedArea,
    stopCamera
  });

  const handleAreaSave = () => {
    if (currentArea.trim() === '') {
      toast({
        title: "Área requerida",
        description: "Por favor ingrese el área.",
        variant: "destructive",
      });
      return;
    }
    setShowAreaInput(false);
  };

  const handleEditSet = (set: PhotoSet) => {
    setEditingSetId(set.id);
    setEditingLevantamiento(set.levantamiento || '');
    setEditingResponsable(set.responsable);
    setEditingResponsableId(set.gerencia_resp_id || null);
    setEditingAreaId(set.id);
    setEditingArea(set.area);
  };

  const handleUpdateSet = (setId: string) => {
    if (editingLevantamiento.trim() === '' || editingResponsable.trim() === '' || editingArea.trim() === '') {
      toast({
        title: "Campos requeridos",
        description: "Por favor, complete todos los campos.",
        variant: "destructive",
      });
      return;
    }

    // updatePhotoSet(
    //   setId,
    //   'levantamiento',
    //   editingLevantamiento,
    //   editingResponsable,
    //   editingResponsableId
    // );
    setEditingSetId(null);
    setEditingLevantamiento('');
    setEditingResponsable('');
    setEditingResponsableId(null);
    setEditingAreaId(null);
    setEditingArea('');
  };

  return (
    <div className="flex flex-col space-y-4">
      {showAreaInput ? (
        <Card className="shadow-lg border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-xl font-bold text-blue-800 text-center">
              Información del Área
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="area">Área</Label>
                <Input
                  type="text"
                  id="area"
                  placeholder="Nombre del área"
                  value={currentArea}
                  onChange={(e) => setCurrentArea(e.target.value)}
                />
              </div>
              <Button onClick={handleAreaSave} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Guardar Área
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-lime-50">
            <CardTitle className="text-xl font-bold text-green-800 text-center">
              Información del Levantamiento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="levantamiento">Levantamiento</Label>
                <Input
                  type="text"
                  id="levantamiento"
                  placeholder="Descripción del levantamiento"
                  value={currentLevantamiento}
                  onChange={(e) => setCurrentLevantamiento(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="responsable">Responsable</Label>
                <Input
                  type="text"
                  id="responsable"
                  placeholder="Nombre del responsable"
                  value={currentResponsable}
                  onChange={(e) => setCurrentResponsable(e.target.value)}
                />
              </div>
              <Button onClick={saveCurrentSet} className="bg-gradient-to-r from-green-600 to-lime-600 hover:from-green-700 hover:to-lime-700">
                Guardar Conjunto
              </Button>
              {currentPhotos.length < 3 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleStopCameraWithFewPhotos}
                  className="border-green-200 text-green-600 hover:bg-green-50"
                >
                  Detener Cámara
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Sets Display */}
      {setPhotoSets && Array.isArray(setPhotoSets) && setPhotoSets.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Conjuntos de Fotos Guardados</h2>
          {setPhotoSets.map((set) => (
            <Card key={set.id} className="shadow-md border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium">{set.area}</CardTitle>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEditSet(set)}
                    disabled={editingSetId !== null}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará el conjunto de fotos permanentemente.
                           ¿Estás seguro de que quieres eliminar este conjunto?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={() => deletePhotoSet(set.id)}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                {editingSetId === set.id ? (
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor={`levantamiento-${set.id}`}>Levantamiento</Label>
                      <Input
                        type="text"
                        id={`levantamiento-${set.id}`}
                        placeholder="Descripción del levantamiento"
                        value={editingLevantamiento}
                        onChange={(e) => setEditingLevantamiento(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`responsable-${set.id}`}>Responsable</Label>
                      <Input
                        type="text"
                        id={`responsable-${set.id}`}
                        placeholder="Nombre del responsable"
                        value={editingResponsable}
                        onChange={(e) => setEditingResponsable(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`area-${set.id}`}>Área</Label>
                      <Input
                        type="text"
                        id={`area-${set.id}`}
                        placeholder="Nombre del area"
                        value={editingArea}
                        onChange={(e) => setEditingArea(e.target.value)}
                      />
                    </div>
                    <Button onClick={() => {
                      updatePhotoSet(set.id, {
                        levantamiento: editingLevantamiento,
                        responsable: editingResponsable,
                        area: editingArea
                      })
                      setEditingSetId(null);
                    }} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      Actualizar Conjunto
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p><strong>Levantamiento:</strong> {set.levantamiento || 'N/A'}</p>
                    <p><strong>Responsable:</strong> {set.responsable}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {set.photos.map((photo) => (
                        <div key={photo.id} className="relative">
                          <img
                            src={photo.url}
                            alt={`Photo ${photo.id}`}
                            className="w-full h-32 object-cover rounded-md border-2 border-gray-100"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deletePhotoFromSet(set.id, photo.id)}
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No hay conjuntos de fotos guardados aún.</p>
      )}
    </div>
  );
};

export default CameraApp;
