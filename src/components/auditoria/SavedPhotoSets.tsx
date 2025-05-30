
import React from 'react';
import { Edit, Check, X, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhotoSet } from '@/types/auditoria';

interface SavedPhotoSetsProps {
  photoSets: PhotoSet[];
  editingSetId: string | null;
  editingLevantamiento: string;
  editingResponsable: string;
  editingAreaId: string | null;
  editingArea: string;
  setEditingSetId: (id: string | null) => void;
  setEditingLevantamiento: (value: string) => void;
  setEditingResponsable: (value: string) => void;
  setEditingAreaId: (id: string | null) => void;
  setEditingArea: (value: string) => void;
  onUpdatePhotoSet: (setId: string, updates: Partial<PhotoSet>) => void;
  onDeletePhotoSet: (setId: string) => void;
  onDeletePhotoFromSet: (setId: string, photoId: string) => void;
}

const SavedPhotoSets = ({
  photoSets,
  editingSetId,
  editingLevantamiento,
  editingResponsable,
  editingAreaId,
  editingArea,
  setEditingSetId,
  setEditingLevantamiento,
  setEditingResponsable,
  setEditingAreaId,
  setEditingArea,
  onUpdatePhotoSet,
  onDeletePhotoSet,
  onDeletePhotoFromSet
}: SavedPhotoSetsProps) => {
  const handleSaveAreaEdit = (setId: string) => {
    onUpdatePhotoSet(setId, { area: editingArea.trim() });
    setEditingAreaId(null);
    setEditingArea('');
  };

  const handleSaveSetEdit = (setId: string) => {
    onUpdatePhotoSet(setId, { 
      levantamiento: editingLevantamiento, 
      responsable: editingResponsable 
    });
    setEditingSetId(null);
    setEditingLevantamiento('');
    setEditingResponsable('');
  };

  const startEditingArea = (set: PhotoSet) => {
    setEditingAreaId(set.id);
    setEditingArea(set.area);
  };

  const startEditingSet = (set: PhotoSet) => {
    setEditingSetId(set.id);
    setEditingLevantamiento(set.levantamiento);
    setEditingResponsable(set.responsable);
  };

  if (photoSets.length === 0) return null;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Conjuntos Guardados ({photoSets.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {photoSets.map((set) => (
          <div key={set.id} className="border rounded-lg p-3 bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              {editingAreaId === set.id ? (
                <div className="flex-1 mr-2">
                  <div className="flex gap-2">
                    <Input
                      value={editingArea}
                      onChange={(e) => setEditingArea(e.target.value)}
                      className="border-gray-200 focus:border-red-500"
                      placeholder="Área..."
                    />
                    <Button
                      onClick={() => handleSaveAreaEdit(set.id)}
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingAreaId(null);
                        setEditingArea('');
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center flex-1 mr-2">
                  <span className="font-medium text-sm flex-1">{set.area}</span>
                  <Button
                    onClick={() => startEditingArea(set)}
                    size="sm"
                    variant="ghost"
                    className="ml-2 w-6 h-6 p-0"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
              )}

              <Button
                onClick={() => onDeletePhotoSet(set.id)}
                size="sm"
                variant="destructive"
                className="w-6 h-6 p-0"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-1 mb-2">
              {set.photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url || URL.createObjectURL(photo.file!)}
                    alt="Set photo"
                    className="w-full aspect-square object-cover rounded"
                  />
                  <Button
                    onClick={() => onDeletePhotoFromSet(set.id, photo.id)}
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 w-5 h-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-2 h-2" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="mt-2">
              {editingSetId === set.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editingLevantamiento}
                    onChange={(e) => setEditingLevantamiento(e.target.value)}
                    className="resize-none border-gray-200 focus:border-red-500"
                    rows={2}
                    placeholder="Editar levantamiento..."
                  />
                  <Input
                    value={editingResponsable}
                    onChange={(e) => setEditingResponsable(e.target.value)}
                    className="border-gray-200 focus:border-red-500"
                    placeholder="Editar responsable..."
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSaveSetEdit(set.id)}
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Guardar
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingSetId(null);
                        setEditingLevantamiento('');
                        setEditingResponsable('');
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium">Levantamiento:</p>
                      <p className="text-sm text-gray-600">
                        {set.levantamiento || "Sin levantamiento"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium">Responsable:</p>
                      <p className="text-sm text-gray-600">
                        {set.responsable || "Sin responsable"}
                      </p>
                    </div>
                    <Button
                      onClick={() => startEditingSet(set)}
                      size="sm"
                      variant="ghost"
                      className="ml-2 w-6 h-6 p-0"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SavedPhotoSets;
