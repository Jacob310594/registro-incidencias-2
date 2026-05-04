/**
 * Sistema de Incidencias Técnicas
 * Laboratorio Cap. 1 - Sistemas de Información
 * Módulo: API Client + App Logic
 */

const API_BASE = "http://localhost:5000/api";

// ─── API Client ──────────────────────────────────────────────────────────────

const api = {
  async get(endpoint, params = {}) {
    const url = new URL(API_BASE + endpoint);
    Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async post(endpoint, body) {
    const res = await fetch(API_BASE + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw Object.assign(new Error("Error API"), { data, status: res.status });
    return data;
  },

  async patch(endpoint, body) {
    const res = await fetch(API_BASE + endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async delete(endpoint) {
    const res = await fetch(API_BASE + endpoint, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
};

// ─── Toast Notifications ─────────────────────────────────────────────────────

function toast(msg, type = "success") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById("toast-container").appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

function initTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("panel-" + target).classList.add("active");

      if (target === "lista")    loadIncidencias();
      if (target === "dashboard") loadDashboard();
    });
  });
}

// ─── Formulario de Registro ───────────────────────────────────────────────────

function initForm() {
  const form        = document.getElementById("form-incidencia");
  const descInput   = document.getElementById("desc");
  const charCount   = document.getElementById("char-count");
  const submitBtn   = document.getElementById("btn-submit");

  // Contador de caracteres en tiempo real
  descInput.addEventListener("input", () => {
    const len = descInput.value.trim().length;
    charCount.textContent = `${len}/10 mín.`;
    charCount.className = "char-count" + (len >= 10 ? " ok" : len > 0 ? " warn" : "");
  });

  // Validación en tiempo real por campo
  form.querySelectorAll("input, textarea, select").forEach(el => {
    el.addEventListener("input", () => clearError(el));
    el.addEventListener("change", () => clearError(el));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Registrando…';

    const payload = {
      titulo:       document.getElementById("titulo").value.trim(),
      descripcion:  descInput.value.trim(),
      categoria:    document.getElementById("categoria").value,
      reportado_por: document.getElementById("reportado_por").value.trim(),
    };

    try {
      await api.post("/incidencias", payload);
      toast("✅ Incidencia registrada correctamente");
      form.reset();
      charCount.textContent = "0/10 mín.";
      charCount.className = "char-count";
    } catch (err) {
      const detail = err.data?.detalle || {};
      Object.entries(detail).forEach(([field, msg]) => {
        const el = document.getElementById(field === "reportado_por" ? "reportado_por" : field);
        if (el) showError(el, msg);
      });
      if (!Object.keys(detail).length) toast("❌ Error al registrar", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Registrar Incidencia';
    }
  });
}

function validateForm() {
  let valid = true;

  const titulo = document.getElementById("titulo");
  if (!titulo.value.trim()) {
    showError(titulo, "El título es obligatorio.");
    valid = false;
  }

  const desc = document.getElementById("desc");
  if (desc.value.trim().length < 10) {
    showError(desc, "Mínimo 10 caracteres.");
    valid = false;
  }

  const cat = document.getElementById("categoria");
  if (!cat.value) {
    showError(cat, "Selecciona una categoría.");
    valid = false;
  }

  const rep = document.getElementById("reportado_por");
  if (!rep.value.trim()) {
    showError(rep, "Nombre del reportante requerido.");
    valid = false;
  }

  return valid;
}

function showError(el, msg) {
  el.classList.add("invalid");
  const errEl = document.getElementById("err-" + el.id);
  if (errEl) { errEl.textContent = msg; errEl.classList.add("visible"); }
}

function clearError(el) {
  el.classList.remove("invalid");
  const errEl = document.getElementById("err-" + el.id);
  if (errEl) errEl.classList.remove("visible");
}

// ─── Lista de Incidencias ─────────────────────────────────────────────────────

async function loadIncidencias() {
  const tbody  = document.getElementById("tabla-body");
  const catFil = document.getElementById("fil-categoria").value;
  const estFil = document.getElementById("fil-estado").value;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px">
    <span class="spinner"></span>
  </td></tr>`;

  try {
    const data = await api.get("/incidencias", { categoria: catFil, estado: estFil });

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <h3>Sin incidencias</h3>
          <p>Cambia los filtros o registra una nueva.</p>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(row => `
      <tr data-id="${row.id}">
        <td style="font-family:var(--font-mono);color:var(--text-muted)">#${row.id}</td>
        <td><strong>${escapeHtml(row.titulo)}</strong></td>
        <td style="max-width:260px;color:var(--text-muted)">${escapeHtml(row.descripcion)}</td>
        <td>
          <span class="badge ${row.categoria === 'A' ? 'badge-critica' : 'badge-leve'}">
            ${row.categoria === 'A' ? '⚠ Crítica' : '○ Leve'}
          </span>
        </td>
        <td>
          <select class="estado-select" onchange="cambiarEstado(${row.id}, this.value)">
            ${["Pendiente","En Proceso","Resuelto"].map(e =>
              `<option ${e === row.estado ? "selected" : ""}>${e}</option>`
            ).join("")}
          </select>
        </td>
        <td style="font-family:var(--font-mono);font-size:.75rem;color:var(--text-muted)">
          ${formatDate(row.fecha_creacion)}
        </td>
        <td>
          <button class="btn btn-ghost" style="padding:6px 12px;font-size:.8rem"
            onclick="eliminarIncidencia(${row.id})">✕</button>
        </td>
      </tr>
    `).join("");

  } catch {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--accent);padding:40px">
      Error al conectar con el servidor. ¿Está corriendo el backend?
    </td></tr>`;
  }
}

async function cambiarEstado(id, estado) {
  try {
    await api.patch(`/incidencias/${id}`, { estado });
    toast(`Estado actualizado → ${estado}`);
  } catch {
    toast("❌ Error al actualizar estado", "error");
  }
}

async function eliminarIncidencia(id) {
  if (!confirm(`¿Eliminar incidencia #${id}?`)) return;
  try {
    await api.delete(`/incidencias/${id}`);
    toast("Incidencia eliminada");
    loadIncidencias();
  } catch {
    toast("❌ Error al eliminar", "error");
  }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

async function loadDashboard() {
  try {
    const d = await api.get("/dashboard");

    const porEstado = {};
    d.por_estado.forEach(r => porEstado[r.estado] = r.total);
    const total = Object.values(porEstado).reduce((a, b) => a + b, 0) || 1;

    const porCat = {};
    d.por_categoria.forEach(r => porCat[r.categoria] = r.total);

    document.getElementById("stat-pendiente").textContent = porEstado["Pendiente"] ?? 0;
    document.getElementById("stat-proceso").textContent   = porEstado["En Proceso"] ?? 0;
    document.getElementById("stat-resuelto").textContent  = porEstado["Resuelto"] ?? 0;
    document.getElementById("stat-tiempo").textContent    = d.promedio_resolucion_horas + "h";
    document.getElementById("stat-hoy").textContent       = d.pendientes_hoy;
    document.getElementById("stat-criticas").textContent  = porCat["A"] ?? 0;

    // Barras de progreso
    setBar("bar-pendiente", (porEstado["Pendiente"] ?? 0) / total * 100);
    setBar("bar-proceso",   (porEstado["En Proceso"] ?? 0) / total * 100);
    setBar("bar-resuelto",  (porEstado["Resuelto"] ?? 0) / total * 100);

  } catch {
    document.getElementById("dashboard-stats").innerHTML =
      `<p style="color:var(--accent)">⚠ No se pudo conectar con el servidor.</p>`;
  }
}

function setBar(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = Math.min(pct, 100) + "%";
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-PA", { day:"2-digit", month:"short", year:"numeric" })
       + " " + d.toLocaleTimeString("es-PA", { hour:"2-digit", minute:"2-digit" });
}

function escapeHtml(str) {
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initForm();
  loadDashboard();

  // Filtros
  document.getElementById("fil-categoria").addEventListener("change", loadIncidencias);
  document.getElementById("fil-estado").addEventListener("change", loadIncidencias);
  document.getElementById("btn-refresh").addEventListener("click", loadIncidencias);
});
