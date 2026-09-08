import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../services/apiClient";

const ROLES = [
  { value: "TMS", label: "TMS Track Maintenance" },
  { value: "SMMS", label: "SMMS Signal & Telecom" },
  { value: "TDMS", label: "TDMS Traction (OHE)" },
  { value: "COA", label: "COA Control Office" },
];

const ZONES = [
  { value: "Northern Railway", label: "Northern Railway" },
  { value: "Eastern Railway", label: "Eastern Railway" },
  { value: "Western Railway", label: "Western Railway" },
  { value: "Southern Railway", label: "Southern Railway" },
];

export default function SignIn() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    userId: "",
    password: "",
    name: "",
    designation: "",
    role: "",
    zone: "",
    division: "",
    captcha: "",
  });
  const [captcha, setCaptcha] = useState({ id: "", code: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const refreshCaptcha = async () => {
    try {
      const { data } = await apiClient.get("/auth/captcha");
      setCaptcha({ id: data.captchaId, code: data.captcha });
    } catch {
      setError("Unable to load CAPTCHA. Check that the backend is running.");
    }
  };

  useEffect(() => { refreshCaptcha(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const missing = Object.values(form).some((v) => !v.trim());
    if (missing) {
      setError("Fill in every field before signing up.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await apiClient.post("/auth/signup", {
        ...form,
        department: form.role,
        captchaId: captcha.id,
      });
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("pragati_rail_user", JSON.stringify(data.user));
      navigate("/");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create account.");
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.body}>
      <div style={styles.card}>
        <div style={styles.topBar} />
        <p style={styles.brand}>PRAGATI-RAIL</p>
        <h1 style={styles.h1}>Create your railway workspace account</h1>

        {error && (
          <div style={styles.error}>{error}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="name">Full Name</label>
            <input style={styles.input} type="text" id="name" name="name" value={form.name} onChange={handleChange} />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="designation">Designation</label>
            <input style={styles.input} type="text" id="designation" name="designation" value={form.designation} onChange={handleChange} />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="userId">User ID</label>
            <input
              style={styles.input}
              type="text"
              id="userId"
              name="userId"
              autoComplete="username"
              placeholder="e.g. rw-0142"
              value={form.userId}
              onChange={handleChange}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">Password</label>
            <input
              style={styles.input}
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label} htmlFor="role">Role</label>
              <select
                style={styles.select}
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <option value="" disabled>Select role</option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label} htmlFor="zone">Zone</label>
              <select
                style={styles.select}
                id="zone"
                name="zone"
                value={form.zone}
                onChange={handleChange}
              >
                <option value="" disabled>Select zone</option>
                {ZONES.map((z) => (
                  <option key={z.value} value={z.value}>{z.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="division">Division</label>
            <input
              style={styles.input}
              type="text"
              id="division"
              name="division"
              placeholder="e.g. Tiruppur Unit 3"
              value={form.division}
              onChange={handleChange}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="captcha">CAPTCHA: {captcha.code || "-----"}</label>
            <input style={styles.input} type="text" id="captcha" name="captcha" value={form.captcha} onChange={handleChange} />
          </div>

          <button style={styles.button} type="submit" disabled={loading}>{loading ? "Creating account..." : "Create account"}</button>
        </form>

        <p style={styles.foot}>Access is logged by zone and division for audit purposes.</p>
      </div>
    </div>
  );
}

const colors = {
  loomGreen: "#2F5D50",
  vatBlue: "#1F3A5F",
  madderRust: "#B5502E",
  turmeric: "#D9A441",
  cream: "#F6F2EA",
  thread: "#DCD3C2",
  ink: "#232323",
  panel: "#FFFFFF",
};

const styles = {
  body: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: `
      repeating-linear-gradient(90deg, ${colors.thread} 0 2px, transparent 2px 22px),
      repeating-linear-gradient(0deg, ${colors.thread} 0 2px, transparent 2px 22px),
      ${colors.cream}`,
    fontFamily: "'Iowan Old Style', Georgia, serif",
    color: colors.ink,
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    background: colors.panel,
    border: `1px solid ${colors.thread}`,
    boxShadow: `0 1px 0 ${colors.thread}, 0 12px 30px rgba(31,58,95,0.08)`,
    padding: "40px 36px 32px",
    position: "relative",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    background: `linear-gradient(90deg, ${colors.loomGreen}, ${colors.vatBlue} 35%, ${colors.madderRust} 70%, ${colors.turmeric})`,
  },
  brand: {
    fontSize: 13,
    letterSpacing: "0.04em",
    color: colors.vatBlue,
    margin: "0 0 4px",
  },
  h1: {
    fontSize: 26,
    fontWeight: 600,
    margin: "0 0 28px",
    color: colors.ink,
  },
  label: {
    display: "block",
    fontSize: 13,
    color: "#5b5346",
    marginBottom: 6,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  field: { marginBottom: 18 },
  input: {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #c9bfa9",
    background: "#fdfcf9",
    fontSize: 15,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: colors.ink,
    borderRadius: 3,
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #c9bfa9",
    background: "#fdfcf9",
    fontSize: 15,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: colors.ink,
    borderRadius: 3,
    boxSizing: "border-box",
    appearance: "none",
    backgroundImage:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><path d='M0 0l5 6 5-6z' fill='%235b5346'/></svg>\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
  },
  row: {
    display: "flex",
    gap: 14,
  },
  button: {
    width: "100%",
    padding: 13,
    marginTop: 6,
    background: colors.vatBlue,
    color: "#fff",
    border: "none",
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    cursor: "pointer",
    borderRadius: 3,
  },
  foot: {
    marginTop: 20,
    fontSize: 12,
    color: "#8a8272",
    textAlign: "center",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  error: {
    background: "#FBEAE3",
    borderLeft: `3px solid ${colors.madderRust}`,
    color: "#7A3117",
    fontSize: 13,
    padding: "10px 12px",
    marginBottom: 18,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
};