
export interface CapturedPhoto {
  id: string;
  file?: File;
  url?: string;
  timestamp: Date;
}

export interface PhotoSet {
  id: string;
  area: string;
  photos: CapturedPhoto[];
  levantamiento: string;
  responsable: string;
  gerencia_resp_id?: number;
  timestamp: Date;
}

export interface UserData {
  name: string;
  position: string;
  gerencia_id?: number;
}

export interface AuditoriaFormData {
  tituloDocumento: string;
  fecha: string;
  auditor: string;
  plantaId: number;
}

export interface AuditoriaData extends AuditoriaFormData {
  id?: string;
  codigoAuditoria: string; // Make this required instead of optional
}

export interface Planta {
  id: number;
  nombre: string;
  iniciales?: string;
}

export interface Gerencia {
  id: number;
  nombre: string;
  iniciales: string;
  activo?: boolean;
}
