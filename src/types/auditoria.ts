
export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
}

export interface PhotoSet {
  id: string;
  area: string;
  photos: CapturedPhoto[];
  levantamiento: string;
  responsable: string;
  timestamp: Date;
}

export interface UserData {
  name: string;
  email: string;
  position: string;
}

export interface AuditoriaFormData {
  tituloDocumento: string;
  fecha: string;
  auditor: string;
}

export interface AuditoriaData extends AuditoriaFormData {
  id?: string;
}
