
export interface BloqueosPhoto {
  id: string;
  url: string;
  file: File;
}

export interface BloqueosFormData {
  fecha: string;
  lote: string;
  codigoProducto: string;
  nombreProducto: string;
  tipoBloqueo: string;
  motivoBloqueo: string;
  plantaId: string;
  cantidad: string;
  ubicacion: string;
  observaciones?: string;
  notificarGerencias: string[];
}

export interface BloqueosData {
  codigo_bloqueo: string;
  fecha: string;
  lote: string;
  codigo_producto: string;
  nombre_producto: string;
  tipo_bloqueo: string;
  motivo_bloqueo: string;
  planta_id: number;
  cantidad: string;
  ubicacion: string;
  observaciones: string;
  usuario_registro_id: string;
  foto_urls: string[];
  notificar_gerencias: string[];
  status: string;
}
