"""
API REST - Sistema de Registro de Incidencias Técnicas
Laboratorio Cap. 1 - Sistemas de Información
Backend: Python + Flask + SQLite
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

app = Flask(__name__, static_folder="../frontend")
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), "../database/incidencias.db")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "../database/schema.sql")


# ─── Helpers de base de datos ────────────────────────────────────────────────

def get_db():
    """Abre conexión a SQLite y retorna filas como dict."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Inicializa la base de datos con el schema si no existe."""
    conn = get_db()
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    print("✅ Base de datos inicializada")


# ─── Rutas de archivos estáticos ──────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory("../frontend", "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory("../frontend", filename)


# ─── API: Incidencias ─────────────────────────────────────────────────────────

@app.route("/api/incidencias", methods=["GET"])
def get_incidencias():
    """
    GET /api/incidencias
    Query params opcionales:
      - categoria: A | B
      - estado:    Pendiente | En Proceso | Resuelto
    """
    categoria = request.args.get("categoria")
    estado    = request.args.get("estado")

    query  = "SELECT * FROM incidencias WHERE 1=1"
    params = []

    if categoria:
        query  += " AND categoria = ?"
        params.append(categoria)
    if estado:
        query  += " AND estado = ?"
        params.append(estado)

    query += " ORDER BY fecha_creacion DESC"

    conn = get_db()
    rows = conn.execute(query, params).fetchall()
    conn.close()

    return jsonify([dict(r) for r in rows])


@app.route("/api/incidencias", methods=["POST"])
def crear_incidencia():
    """
    POST /api/incidencias
    Body JSON: titulo, descripcion, categoria, reportado_por
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Cuerpo JSON requerido"}), 400

    # ── Validaciones (Tarea 1: Control de Entrada) ──────────────────────────
    errores = {}

    titulo = (data.get("titulo") or "").strip()
    if not titulo:
        errores["titulo"] = "El título es obligatorio."

    descripcion = (data.get("descripcion") or "").strip()
    if len(descripcion) < 10:
        errores["descripcion"] = "La descripción debe tener al menos 10 caracteres."

    categoria = data.get("categoria")
    if categoria not in ("A", "B"):
        errores["categoria"] = "La categoría debe ser A (Crítica) o B (Leve)."

    reportado_por = (data.get("reportado_por") or "").strip()
    if not reportado_por:
        errores["reportado_por"] = "El nombre del reportante es obligatorio."

    if errores:
        return jsonify({"error": "Datos inválidos", "detalle": errores}), 422

    # ── Inserción ────────────────────────────────────────────────────────────
    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO incidencias (titulo, descripcion, categoria, reportado_por)
           VALUES (?, ?, ?, ?)""",
        (titulo, descripcion, categoria, reportado_por),
    )
    conn.commit()
    nueva_id = cursor.lastrowid
    row = conn.execute("SELECT * FROM incidencias WHERE id = ?", (nueva_id,)).fetchone()
    conn.close()

    return jsonify(dict(row)), 201


@app.route("/api/incidencias/<int:id_>", methods=["PATCH"])
def actualizar_estado(id_):
    """
    PATCH /api/incidencias/<id>
    Body JSON: estado (Pendiente | En Proceso | Resuelto)
    Tarea 2: Transformación de estados
    """
    data   = request.get_json(silent=True) or {}
    estado = data.get("estado")

    if estado not in ("Pendiente", "En Proceso", "Resuelto"):
        return jsonify({"error": "Estado inválido"}), 422

    fecha_res = datetime.now().isoformat() if estado == "Resuelto" else None

    conn = get_db()
    conn.execute(
        "UPDATE incidencias SET estado = ?, fecha_resolucion = ? WHERE id = ?",
        (estado, fecha_res, id_),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM incidencias WHERE id = ?", (id_,)).fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Incidencia no encontrada"}), 404

    return jsonify(dict(row))


@app.route("/api/incidencias/<int:id_>", methods=["DELETE"])
def eliminar_incidencia(id_):
    """DELETE /api/incidencias/<id>"""
    conn = get_db()
    conn.execute("DELETE FROM incidencias WHERE id = ?", (id_,))
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Incidencia eliminada"}), 200


# ─── API: Dashboard (Tarea 3) ─────────────────────────────────────────────────

@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    """
    GET /api/dashboard
    Retorna métricas para el panel de decisiones:
      - total por estado
      - total por categoría
      - tiempo promedio de resolución (horas)
      - pendientes hoy
    """
    conn = get_db()

    stats_estado = conn.execute(
        "SELECT estado, COUNT(*) as total FROM incidencias GROUP BY estado"
    ).fetchall()

    stats_cat = conn.execute(
        "SELECT categoria, COUNT(*) as total FROM incidencias GROUP BY categoria"
    ).fetchall()

    # Tiempo promedio de resolución en horas
    avg_row = conn.execute(
        """SELECT AVG(
               (julianday(fecha_resolucion) - julianday(fecha_creacion)) * 24
           ) AS promedio_horas
           FROM incidencias
           WHERE estado = 'Resuelto' AND fecha_resolucion IS NOT NULL"""
    ).fetchone()

    # Pendientes creadas hoy
    hoy = conn.execute(
        """SELECT COUNT(*) as total FROM incidencias
           WHERE date(fecha_creacion) = date('now')
           AND estado = 'Pendiente'"""
    ).fetchone()

    conn.close()

    return jsonify({
        "por_estado":  [dict(r) for r in stats_estado],
        "por_categoria": [dict(r) for r in stats_cat],
        "promedio_resolucion_horas": round(avg_row["promedio_horas"] or 0, 2),
        "pendientes_hoy": hoy["total"],
    })


# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    print("🚀 Servidor corriendo en http://localhost:5000")
    app.run(debug=True, port=5000)
