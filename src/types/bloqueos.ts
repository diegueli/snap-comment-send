
export interface BloqueosPhoto {
  id: string;
  url: string;
  file: File;
}

export interface BloqueosFormData {
  planta_id: number;
  area_planta_id: number;
  producto_id: number;
  cantidad: number;
  lote: number;
  turno_id: number;
  fecha: string;
  motivo: string;
  quien_bloqueo: string;
}

export interface BloqueosData extends BloqueosFormData {
  codigo_bloqueo: string;
  foto_urls: string[];
}
