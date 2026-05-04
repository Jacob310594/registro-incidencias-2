-- ============================================================
-- Sistema de Registro de Incidencias Técnicas
-- Laboratorio Cap. 1 - Sistemas de Información
-- ============================================================

CREATE TABLE IF NOT EXISTS incidencias (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo      TEXT    NOT NULL,
    descripcion TEXT    NOT NULL CHECK(length(descripcion) >= 10),
    categoria   TEXT    NOT NULL CHECK(categoria IN ('A', 'B')),
    estado      TEXT    NOT NULL DEFAULT 'Pendiente'
                        CHECK(estado IN ('Pendiente', 'En Proceso', 'Resuelto')),
    reportado_por TEXT  NOT NULL,
    fecha_creacion   DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion DATETIME,
    CONSTRAINT check_fechas CHECK (fecha_resolucion IS NULL OR fecha_resolucion >= fecha_creacion)
);

-- Índices para optimizar la búsqueda y filtrado de incidencias
CREATE INDEX IF NOT EXISTS idx_incidencias_estado ON incidencias(estado);
CREATE INDEX IF NOT EXISTS idx_incidencias_categoria ON incidencias(categoria);

-- Datos de ejemplo
INSERT INTO incidencias (titulo, descripcion, categoria, estado, reportado_por)
VALUES
  ('Servidor caído producción', 'El servidor principal de producción dejó de responder a las 8:00 AM.', 'A', 'Pendiente', 'Juan Pérez'),
  ('Error en módulo de ventas', 'El módulo de ventas no calcula impuestos correctamente en facturas.', 'A', 'En Proceso', 'María López'),
  ('Actualizar ícono de app', 'El ícono de la aplicación móvil está desactualizado con el nuevo branding.', 'B', 'Resuelto', 'Carlos Ruiz'),
  ('Lentitud en reportes', 'Los reportes mensuales tardan más de 5 minutos en cargarse.', 'B', 'Pendiente', 'Ana Torres');
