import { useState, useEffect } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Prefer": "return=representation",
};

const db = {
  async getAll() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/students?order=created_at.asc`, { headers });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async insert(data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
      method: "POST", headers,
      body: JSON.stringify(data),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(res.status + ': ' + text);
    const rows = JSON.parse(text);
    return rows[0];
  },
  async update(id, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.${id}`, {
      method: "PATCH", headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    const rows = await res.json();
    return rows[0];
  },
};

function fromDB(s: any) {
  return {
    id: s.id,
    name: s.name,
    age: s.age,
    parentPhone: s.parent_phone,
    level: s.level,
    total: s.total_sessions,
    remaining: s.remaining_sessions,
    notes: s.notes || [],
  };
}

const LEVELS = ["mini", "kid", "kid+"];
const TABS = ["Ученики", "Сегодня", "Добавить"];

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2);
  const hue = (name.charCodeAt(0) * 37 + (name.charCodeAt(1) || 0) * 13) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `hsl(${hue}, 60%, 55%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.35,
      flexShrink: 0, letterSpacing: 1,
    }}>{initials}</div>
  );
}

function AbonBar({ remaining, total }: { remaining: number; total: number }) {
const pct = total > 0 ? remaining / total : 0;
  const color = pct <= 0.25 ? "#ff4d4d" : pct <= 0.5 ? "#ffaa00" : "#4dff9e";
return (
  <div style={{ marginTop: 6 }}>
     <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888", marginBottom: 3 }}>
   <span>Занятий осталось</span>
    <span style={{ color, fontWeight: 700 }}>{remaining} / {total}</span>
        </div>
    <div style={{ height: 5, borderRadius: 99, background: "#2a2a2a", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct * 100}%`, background: color, borderRadius: 99, transition: "width .4s" }} />
  </div>
    </div>
  );
}

function Badge({ level }: { level: string }) {
  const colors: Record<string, string> = { "mini": "#3a7aff", "kid": "#ffaa00", "kid+": "#4dff9e" };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
      background: (colors[level] || "#888") + "22", color: colors[level] || "#888",
      border: `1px solid ${(colors[level] || "#888")}44`,
      letterSpacing: 0.5, textTransform: "uppercase",
    }}>{level}</span>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        border: "3px solid #222", borderTopColor: "#ffaa00",
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Toast({ msg, type }: { msg: string; type: string }) {
  return (
    <div style={{
      position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
      background: type === "error" ? "#ff4d4d" : "#4dff9e",
      color: "#000", fontWeight: 700, fontSize: 13,
      padding: "10px 20px", borderRadius: 99, zIndex: 200,
      boxShadow: "0 4px 20px #0008", whiteSpace: "nowrap",
    }}>{msg}</div>
  );
}

function StudentCard({ student, onSelect, onMarkVisit, isLoading }: any) {
  const lowBalance = student.remaining <= 2;
  return (
    <div onClick={() => onSelect(student)} style={{
      background: "#141414", border: "1px solid #222", borderRadius: 16,
      padding: "16px", cursor: "pointer", transition: "border-color .2s, transform .15s",
      position: "relative", overflow: "hidden", opacity: isLoading ? 0.6 : 1,
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#444"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#222"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
    >
      {lowBalance && student.remaining > 0 && (
        <div style={{ position: "absolute", top: 0, right: 0, background: "#ff4d4d", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 10px", borderBottomLeftRadius: 10, letterSpacing: 1 }}>
          ЗАКАНЧИВАЕТСЯ
        </div>
      )}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Avatar name={student.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#f0f0f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{student.name}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
            <Badge level={student.level} />
            <span style={{ fontSize: 11, color: "#555" }}>{student.age} лет</span>
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onMarkVisit(student); }}
          disabled={isLoading || student.remaining === 0}
          style={{
            background: "#1a1a1a", border: "1px solid #333", borderRadius: 10,
            color: student.remaining === 0 ? "#333" : "#4dff9e",
            fontSize: 18, width: 36, height: 36,
            cursor: (isLoading || student.remaining === 0) ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >✓</button>
      </div>
      <AbonBar remaining={student.remaining} total={student.total} />
    </div>
  );
}

function StudentDetail({ student, onClose, onAddNote, onLevelChange }: any) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submitNote = async () => {
    if (!note.trim() || saving) return;
    setSaving(true);
    await onAddNote(student.id, note.trim());
    setNote("");
    setSaving(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000cc", zIndex: 100,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#111", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480,
        padding: 24, maxHeight: "80vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
          <Avatar name={student.name} size={56} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#f0f0f0" }}>{student.name}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
              <select
                value={student.level}
                onChange={e => onLevelChange(student.id, e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{
                  background: "#1a1a1a", border: "1px solid #333", borderRadius: 8,
                  color: "#ccc", fontSize: 12, padding: "3px 8px", cursor: "pointer",
                }}
              >
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
              <span style={{ fontSize: 12, color: "#555" }}>{student.age} лет</span>
            </div>
          </div>
        </div>

        <div style={{ background: "#ffaa00", borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Родитель</div>
          <div style={{ color: "#ccc", fontSize: 14 }}>📞 {student.parentPhone || "—"}</div>
        </div>

        <AbonBar remaining={student.remaining} total={student.total} />

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Прогресс</div>
          {student.notes.length === 0 && <div style={{ color: "#444", fontSize: 13 }}>Заметок пока нет</div>}
          {student.notes.map((n: string, i: number) => (
            <div key={i} style={{ background: "#181818", borderRadius: 10, padding: "10px 14px", marginBottom: 8, fontSize: 13, color: "#bbb" }}>
              🏅 {n}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submitNote()}
            placeholder="Добавить заметку о прогрессе..."
            style={{
              flex: 1, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10,
              padding: "10px 14px", color: "#f0f0f0", fontSize: 13, outline: "none",
            }}
          />
          <button onClick={submitNote} disabled={saving}
            style={{
              background: "#ffff", color: "#e0860f", fontWeight: 800, border: "none",
              borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontSize: 13,
              opacity: saving ? 0.6 : 1,
            }}>+</button>
        </div>
      </div>
    </div>
  );
}

function TodayTab({ students, onMarkVisit, loadingId }: any) {
  return (
    <div>
      <div style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>Отметьте посещаемость сегодняшней тренировки</div>
      {students.length === 0 && <div style={{ color: "#444", fontSize: 14, textAlign: "center", paddingTop: 30 }}>Учеников пока нет</div>}
      {students.map((s: any) => (
        <div key={s.id} style={{
          background: "#141414", border: "1px solid #222", borderRadius: 14,
          padding: "14px 16px", marginBottom: 10,
          display: "flex", alignItems: "center", gap: 12,
          opacity: loadingId === s.id ? 0.6 : 1,
        }}>
          <Avatar name={s.name} size={36} />
          <div style={{ flex: 1 }}>
            <div style={{ color: "#f59506", fontWeight: 600, fontSize: 14 }}>{s.name}</div>
            <div style={{ fontSize: 11, color: s.remaining <= 2 ? "#ff4d4d" : "#555" }}>
              {s.remaining === 0 ? "❌ Абонемент закончился" : s.remaining <= 2 ? `⚠️ Осталось ${s.remaining}` : `Осталось: ${s.remaining}`}
            </div>
          </div>
          <button onClick={() => onMarkVisit(s)}
            disabled={loadingId === s.id || s.remaining === 0}
            style={{
              background: s.remaining === 0 ? "#f59506" : "#ffff",
              color: s.remaining === 0 ? "#444" : "#000",
              fontWeight: 800, border: "none", borderRadius: 10,
              padding: "8px 14px", cursor: s.remaining === 0 ? "not-allowed" : "pointer", fontSize: 13,
            }}>Был</button>
        </div>
      ))}
    </div>
  );
}

function AddTab({ onAdd }: any) {
  const [form, setForm] = useState({ name: "", age: "", phone: "", level: "Начинающий", sessions: "8" });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const inputStyle = {
    width: "100%", background: "#141414", border: "1px solid #2a2a2a",
    borderRadius: 10, padding: "12px 14px", color: "#f0f0f0", fontSize: 14,
    outline: "none", boxSizing: "border-box" as const,
  };

  const submit = async () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    await onAdd({ name: form.name.trim(), age: +form.age || null, phone: form.phone.trim(), level: form.level, sessions: +form.sessions });
    setForm({ name: "", age: "", phone: "", level: "Начинающий", sessions: "8" });
    setSaving(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input style={inputStyle} placeholder="Имя ученика" value={form.name} onChange={e => set("name", e.target.value)} />
      <input style={inputStyle} placeholder="Возраст" type="number" value={form.age} onChange={e => set("age", e.target.value)} />
      <input style={inputStyle} placeholder="Телефон родителя" value={form.phone} onChange={e => set("phone", e.target.value)} />
      <select style={{ ...inputStyle }} value={form.level} onChange={e => set("level", e.target.value)}>
        {LEVELS.map(l => <option key={l}>{l}</option>)}
      </select>
      <select style={{ ...inputStyle }} value={form.sessions} onChange={e => set("sessions", e.target.value)}>
        {[4, 8, 12].map(n => <option key={n} value={n}>{n} занятий</option>)}
      </select>
      <button onClick={submit} disabled={saving}
        style={{
          background: "#4dff9e", color: "#000", fontWeight: 800, border: "none",
          borderRadius: 12, padding: "14px", cursor: "pointer", fontSize: 15, marginTop: 4,
          opacity: saving ? 0.6 : 1,
        }}>{saving ? "Сохраняем…" : "Добавить ученика"}</button>
    </div>
  );
}

export default function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);
  const [tab, setTab] = useState("Ученики");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [dbError, setDbError] = useState(null);

  const showToast = (msg: string, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    db.getAll()
      .then((rows: any) => setStudents(rows.map(fromDB)))
      .catch((e: any) => setDbError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const markVisit = async (student: any) => {
    if (student.remaining <= 0 || loadingId) return;
    setLoadingId(student.id);
    try {
      const updated = await db.update(student.id, { remaining_sessions: student.remaining - 1 });
      const mapped = fromDB(updated);
      setStudents(ss => ss.map(s => s.id === mapped.id ? mapped : s));
      if ((selected as any)?.id === mapped.id) setSelected(mapped);
      showToast(`✓ Занятие отмечено — осталось ${mapped.remaining}`);
    } catch {
      showToast("Ошибка сохранения", "error");
    }
    setLoadingId(null);
  };

  const addNote = async (id: string, note: string) => {
    const student = students.find(s => s.id === id);
    const newNotes = [...(student as any).notes, note];
    try {
      const updated = await db.update(id, { notes: newNotes });
      const mapped = fromDB(updated);
      setStudents(ss => ss.map(s => s.id === id ? mapped : s));
      setSelected(mapped);
      showToast("Заметка сохранена");
    } catch {
      showToast("Ошибка сохранения", "error");
    }
  };

  const changeLevel = async (id: string, level: string) => {
    try {
      const updated = await db.update(id, { level });
      const mapped = fromDB(updated);
      setStudents(ss => ss.map(s => s.id === id ? mapped : s));
      setSelected(mapped);
    } catch {
      showToast("Ошибка обновления", "error");
    }
  };

  const addStudent = async ({ name, age, phone, level, sessions }: any) => {
    try {
      const row = await db.insert({
        name, age, parent_phone: phone, level,
        total_sessions: sessions, remaining_sessions: sessions, notes: [],
      });
      setStudents(ss => [...ss, fromDB(row)]);
      setTab("Ученики");
      showToast(`${name} добавлен!`);
    } catch (e: any) {
      showToast("Ошибка: " + e.message, "error");
      console.error("ADD ERROR:", e);
    }
  };

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const lowBalance = students.filter(s => s.remaining <= 2 && s.remaining > 0);

  return (
    <div style={{
      minHeight: "100vh", background: "#ffff", color: "#f0f0f0",
      fontFamily: "'Manrope', 'Segoe UI', sans-serif",
      maxWidth: 480, margin: "0 auto", paddingBottom: 80,
    }}>
      {toast && <Toast msg={(toast as any).msg} type={(toast as any).type} />}

      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ fontSize: 11, color: "#0a0a0a", fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>
          THEKIDSCOOTER 
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
<<<<<<< HEAD
          <div style={{ fontSize: 26, fontWeight: 900, color: "#f59506", lineHeight: 1.1 }}>
            Школа трюкового<br />самоката 
=======
          <div style={{ fontSize: 26, fontWeight: 900, color: "#ffaa00", lineHeight: 1.1 }}>
            Школа трюкового<br />самоката 
>>>>>>> aa35c401bdd0e7ad27ffd30fea629cd62c0662b5
          </div>
          <div style={{ textAlign: "right", paddingTop: 4 }}>
            <div style={{ color: "#4dff9e", fontWeight: 900, fontSize: 22 }}>{students.length}</div>
            <div style={{ fontSize: 11, color: "#444" }}>учеников</div>
          </div>
        </div>

        {lowBalance.length > 0 && (
          <div style={{
            marginTop: 16, background: "#ff4d4d11", border: "1px solid #ff4d4d44",
            borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#ff8888",
          }}>
            ⚠️ У {lowBalance.length} {lowBalance.length === 1 ? "ученика заканчивается" : "учеников заканчивается"} абонемент
          </div>
        )}

        {dbError && (
          <div style={{
            marginTop: 12, background: "#ff4d4d22", border: "1px solid #ff4d4d55",
            borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#ff8888",
          }}>
            ⚠️ {dbError}
          </div>
        )}
      </div>

      {tab === "Ученики" && (
        <div style={{ padding: "16px 20px 0" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="  Поиск ученика..."
            style={{
              width: "100%", background: "#141414", border: "1px solid #222",
              borderRadius: 12, padding: "11px 16px", color: "#f0f0f0", fontSize: 14,
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      )}

      <div style={{ padding: "16px 20px 0" }}>
        {loading && <Spinner />}

        {!loading && tab === "Ученики" && (
          filtered.length === 0
            ? <div style={{ color: "#444", fontSize: 14, textAlign: "center", paddingTop: 40 }}>
              {search ? "Ничего не найдено" : "Добавьте первого ученика →"}
            </div>
            : filtered.map(s => (
              <div key={s.id} style={{ marginBottom: 12 }}>
                <StudentCard student={s} onSelect={setSelected} onMarkVisit={markVisit} isLoading={loadingId === s.id} />
              </div>
            ))
        )}

        {!loading && tab === "Сегодня" && (
          <TodayTab students={students} onMarkVisit={markVisit} loadingId={loadingId} />
        )}

  {tab === "Добавить" && <AddTab onAdd={addStudent} />}
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, background: "#0f0f0f",
        borderTop: "1px solid #1e1e1e", display: "flex",
        padding: "10px 0 16px",
      }}>
        {TABS.map(t => {
          const icons: Record<string, string> = { "Ученики": "👥", "Сегодня": "📋", "Добавить": "＋" };
          const active = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              color: active ? "#4dff9e" : "#444", transition: "color .2s",
            }}>
              <span style={{ fontSize: 20 }}>{icons[t]}</span>
              <span style={{ fontSize: 10, fontWeight: active ? 800 : 500, letterSpacing: 0.5 }}>{t}</span>
            </button>
          );
        })}
      </div>

      {selected && (
        <StudentDetail
          student={selected}
          onClose={() => setSelected(null)}
          onAddNote={addNote}
          onLevelChange={changeLevel}
        />
      )}
    </div>
  );
}
