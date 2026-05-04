# 🛠 Sistema de Registro de Incidencias Técnicas

> **Laboratorio Opción 1 — Cap. 1: El Ciclo de Vida del Dato**  
> Curso: Sistemas de Información

---

## 📁 Estructura del Proyecto

```
incidencias-tecnicas/
├── backend/
│   └── app.py            # API REST con Flask + SQLite
├── database/
│   └── schema.sql        # Esquema + datos de ejemplo
├── frontend/
│   ├── index.html        # Interfaz principal
│   ├── css/
│   │   └── styles.css    # Estilos (dark theme / industrial)
│   └── js/
│       └── app.js        # Lógica JS + cliente API
├── requirements.txt
├── .gitignore
└── README.md
```

---

## 🚀 Cómo ejecutar

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/incidencias-tecnicas.git
cd incidencias-tecnicas
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Iniciar el servidor

```bash
cd backend
python app.py
```

El servidor levanta en `http://localhost:5000`.  
La interfaz web se sirve automáticamente desde esa misma URL.

---

## 🔌 Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/incidencias` | Listar todas (filtros: `?categoria=A&estado=Pendiente`) |
| `POST` | `/api/incidencias` | Crear nueva incidencia |
| `PATCH` | `/api/incidencias/<id>` | Cambiar estado |
| `DELETE` | `/api/incidencias/<id>` | Eliminar incidencia |
| `GET` | `/api/dashboard` | Métricas del dashboard |

---

## 📚 Tareas del Laboratorio Implementadas

### ✅ Tarea 1 — Control de Entrada (Evitando el Ruido)
- Validación **doble capa**: cliente (JS) y servidor (Python/Flask).
- La descripción se rechaza si tiene menos de **10 caracteres**.
- El servidor retorna errores por campo en JSON (`422 Unprocessable`).

### ✅ Tarea 2 — Clasificación (Tipos de Información)
- **Categoría A**: Crítica — afecta la operación.
- **Categoría B**: Leve — sugerencias o fallos menores.
- Al cambiar el estado desde la tabla se registra `fecha_resolucion`.

### ✅ Tarea 3 — Dashboard de Decisiones (Atributo de Oportunidad)
- Incidencias pendientes **hoy**.
- Tiempo promedio de resolución en horas.
- Distribución visual por estado con barras de progreso.

---

## 💡 Reflexión (criterio de evaluación)

> **¿Por qué es peligroso no validar los datos de entrada?**

Sin validación, cualquier usuario puede ingresar datos vacíos, incoherentes
o maliciosos. Esto genera **ruido semántico** en la base de datos: registros
sin información útil que corrompen los reportes y dificultan la toma de
decisiones. En el peor caso, un formulario sin sanitizar expone el sistema
a ataques de **SQL Injection**, comprometiendo toda la información de la empresa.

---

## 🛠 Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3 + Flask |
| Base de datos | SQLite (archivo local) |
| Frontend | HTML5 + CSS3 + JS vanilla |
| Fuentes | Space Mono + DM Sans (Google Fonts) |
