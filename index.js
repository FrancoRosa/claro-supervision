/* ================= CONFIG ================= */
const GOOGLE_FORM_URL =
  "https://docs.google.com/forms/u/0/d/e/1FAIpQLSfQBkB2TQJwi-v9V35gpcq-3ypbj2S34yaPZB1eb-gcDEX1VQ/formResponse";

/* ================= USUARIOS ================= */
const USERS = {
  "Javier Aparicio": { pin: "1234", role: "admin" },
  "Xavier Santisteban": { pin: "1111", role: "supervisor" },
  "Rene Flores": { pin: "2222", role: "supervisor" },
  "Yohan Chavez": { pin: "3333", role: "supervisor" },
};

const $ = (i) => document.getElementById(i);
const SESSION = "session_user";

/* ================= STORAGE ================= */
const load = () => JSON.parse(localStorage.getItem("hist") || "[]");
const save = (h) => localStorage.setItem("hist", JSON.stringify(h));

/* ================= LOGIN ================= */
loginBtn.onclick = () => {
  if (!USERS[loginUser.value] || USERS[loginUser.value].pin !== loginPin.value)
    return alert("PIN incorrecto");
  localStorage.setItem(
    SESSION,
    JSON.stringify({
      user: loginUser.value,
      role: USERS[loginUser.value].role,
    })
  );
  init();
};
logoutBtn.onclick = () => {
  localStorage.clear();
  location.reload();
};

function init() {
  const s = JSON.parse(localStorage.getItem(SESSION));
  loginPanel.classList.add("hidden");
  appPanel.classList.remove("hidden");
  supervisor.innerHTML = `<option>${s.user}</option>`;
  render();
}
if (localStorage.getItem(SESSION)) init();

/* ================= DISTRITOS ================= */
const distritos = {
  Apurímac: ["Abancay", "Curahuasi"],
  Cusco: ["Cusco", "Wanchaq", "San Sebastián", "San Jerónimo", "Santiago"],
  "Madre de Dios": ["Tambopata", "Mazuco"],
};

departamento.onchange = () => {
  distrito.innerHTML = "";
  (distritos[departamento.value] || []).forEach((d) => {
    let o = document.createElement("option");
    o.textContent = d;
    distrito.appendChild(o);
  });
  distrito.disabled = false;
};

const zona = (d) =>
  [
    "Cusco",
    "Wanchaq",
    "San Sebastián",
    "San Jerónimo",
    "Santiago",
    "Tambopata",
  ].includes(d)
    ? "Cercana"
    : "Lejana";

/* ================= ACTIVIDADES ================= */
const obsMap = {
  charla: "Tema charla",
  planos: "N° Plano",
  checklist: "Cuadrillas",
  tdr: "Institución",
  capacitacion: "Tema",
  evaluacion: "Técnico",
  desplazamiento: "Detalle",
  otras: "Detalle",
};

actividad.onchange = () => {
  obsFields.classList.add("hidden");
  officeFields.classList.add("hidden");
  supervisionFields.classList.add("hidden");
  obsInput.value = "";
  if (obsMap[actividad.value]) {
    obsLabel.textContent = obsMap[actividad.value];
    obsFields.classList.remove("hidden");
  }
  if (actividad.value === "oficina") officeFields.classList.remove("hidden");
  if (actividad.value === "supervision")
    supervisionFields.classList.remove("hidden");
};

/* ================= TIMER ================= */
let t = null,
  start = 0,
  el = 0;
const fmt = (s) => new Date(s * 1000).toISOString().substr(11, 8);

startBtn.onclick = () => {
  if (t) return;
  start = Date.now() - el * 1000;
  t = setInterval(() => {
    el = (Date.now() - start) / 1000;
    timeDisplay.textContent = fmt(el);
  }, 500);
};
pauseBtn.onclick = () => {
  clearInterval(t);
  t = null;
};

stopBtn.onclick = () => {
  if (!actividad.value || !distrito.value) return alert("Complete los datos");

  clearInterval(t);
  t = null;
  guardar();

  stopBtn.classList.add("stop-active");
  stopBtn.textContent = "Registro enviado";
  setTimeout(() => {
    stopBtn.classList.remove("stop-active");
    stopBtn.textContent = "Detener";
  }, 2000);

  el = 0;
  timeDisplay.textContent = "00:00:00";
};

function guardar() {
  const n = new Date();
  const s = JSON.parse(localStorage.getItem(SESSION));

  const r = {
    fecha: n.toLocaleDateString(),
    hora: n.toLocaleTimeString(),
    supervisor: s.user,
    departamento: departamento.value,
    distrito: distrito.value,
    zona: zona(distrito.value),
    actividad: actividad.value,
    contrata: contrata.value,
    tecnologia: actividad.value === "supervision" ? tecnologia.value : "",
    sot: actividad.value === "supervision" ? sot.value : "",
    tipoTrabajo: actividad.value === "supervision" ? tipoTrabajo.value : "",
    observaciones:
      actividad.value === "almuerzo"
        ? "Almuerzo"
        : actividad.value === "oficina"
        ? officeSelect.value
        : obsInput.value,
    duracion: fmt(el),
  };

  const h = load();
  h.push(r);
  save(h);
  render();

  // Submit to Google Form using fetch to avoid redirects
  const entries = {
    "entry.103339169": r.fecha,
    "entry.2004622468": r.hora,
    "entry.361164291": r.supervisor,
    "entry.970136920": r.departamento,
    "entry.598316467": r.distrito,
    "entry.1875351169": r.zona,
    "entry.446536339": r.actividad,
    "entry.680417651": r.contrata,
    "entry.1803823095": r.tecnologia,
    "entry.2092199033": r.sot,
    "entry.321622034": r.tipoTrabajo,
    "entry.1857592048": r.observaciones,
    "entry.1968808711": r.duracion,
  };

  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.append(key, value);
  }
  fetch(GOOGLE_FORM_URL, {
    method: 'POST',
    body: formData,
    mode: 'no-cors'
  }).catch(err => console.error('Submission error:', err));
}

/* ================= RENDER ================= */
function render() {
  const s = JSON.parse(localStorage.getItem(SESSION));
  histBody.innerHTML = "";
  load()
    .filter((i) => s.role === "admin" || i.supervisor === s.user)
    .forEach((i) => {
      histBody.innerHTML += `<tr>
<td>${i.fecha}</td><td>${i.hora}</td><td>${i.supervisor}</td>
<td>${i.departamento}</td><td>${i.distrito}</td><td>${i.zona}</td>
<td>${i.actividad}</td><td>${i.contrata}</td>
<td>${i.tecnologia}</td><td>${i.sot}</td><td>${i.tipoTrabajo}</td>
<td>${i.observaciones}</td><td>${i.duracion}</td>
</tr>`;
    });
}

/* ================= EXPORT EXCEL ================= */
exportBtn.onclick = () => {
  const rows = load();
  if (!rows.length) return alert("Sin datos");

  let csv =
    "Fecha,Hora,Supervisor,Departamento,Distrito,Zona,Actividad,Contrata,Tecnologia,SOT,TipoTrabajo,Observaciones,Duracion\n";
  rows.forEach((r) => {
    csv += `${r.fecha},${r.hora},${r.supervisor},${r.departamento},${r.distrito},${r.zona},${r.actividad},${r.contrata},${r.tecnologia},${r.sot},${r.tipoTrabajo},${r.observaciones},${r.duracion}\n`;
  });

  const blob = new Blob([csv], { type: "application/vnd.ms-excel" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "supervision_registros.xls";
  a.click();
};
