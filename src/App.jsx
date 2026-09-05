import React, { useEffect, useState } from "react";
import Portion from "./Portion.jsx";
import { getCurrentSession, onAuthChange, loginWithPassword, registerAccount, requestPasswordReset } from "./lib/auth.js";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = laddar, null = utloggad
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCurrentSession().then(setSession).catch(() => setSession(null));
    const unsubscribe = onAuthChange((s) => setSession(s));
    return unsubscribe;
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (mode === "register" && password !== confirmPassword) {
      setError("Lösenorden matchar inte.");
      return;
    }
    if (password.length < 8) {
      setError("Lösenordet måste vara minst 8 tecken.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "register") {
        await registerAccount(email, password);
        setInfo("Konto skapat! Kolla din mejl för att bekräfta adressen innan du loggar in.");
      } else {
        await loginWithPassword(email, password);
      }
    } catch (err) {
      setError(err.message || "Något gick fel.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Skriv in din e-postadress ovan först.");
      return;
    }
    try {
      await requestPasswordReset(email);
      setInfo("Ett återställningsmejl är på väg, om adressen finns registrerad.");
    } catch (err) {
      setError(err.message || "Något gick fel.");
    }
  }

  if (session === undefined) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#8B8D97" }}>
        Laddar …
      </div>
    );
  }

  if (session) {
    return <Portion />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#121317",
        color: "#F5F6F8",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        padding: 24,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{ width: "100%", maxWidth: 360, backgroundColor: "#1C1E24", borderRadius: 16, padding: 28 }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Femtes AI kcal</h1>
        <p style={{ fontSize: 13, color: "#8B8D97", marginBottom: 20 }}>
          {mode === "login" ? "Logga in på ditt konto" : "Skapa ett nytt konto"}
        </p>

        <label style={{ fontSize: 12, color: "#8B8D97", display: "block", marginBottom: 4 }}>E-postadress</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <label style={{ fontSize: 12, color: "#8B8D97", display: "block", margin: "12px 0 4px" }}>Lösenord</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        {mode === "register" && (
          <>
            <label style={{ fontSize: 12, color: "#8B8D97", display: "block", margin: "12px 0 4px" }}>
              Bekräfta lösenord
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
            />
          </>
        )}

        {error && <p style={{ color: "#FF6B4A", fontSize: 13, marginTop: 12 }}>{error}</p>}
        {info && <p style={{ color: "#6FCF57", fontSize: 13, marginTop: 12 }}>{info}</p>}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%",
            marginTop: 20,
            padding: "12px 0",
            borderRadius: 999,
            border: "none",
            backgroundColor: "#8B6BFF",
            color: "#FFFFFF",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "Ett ögonblick …" : mode === "login" ? "Logga in" : "Registrera"}
        </button>

        {mode === "login" ? (
          <>
            <button type="button" onClick={handleForgotPassword} style={linkStyle}>
              Glömt lösenord?
            </button>
            <p style={{ fontSize: 13, color: "#8B8D97", marginTop: 16, textAlign: "center" }}>
              Har du inget konto?{" "}
              <button type="button" onClick={() => setMode("register")} style={{ ...linkStyle, display: "inline" }}>
                Skapa ett här
              </button>
            </p>
          </>
        ) : (
          <p style={{ fontSize: 13, color: "#8B8D97", marginTop: 16, textAlign: "center" }}>
            Har du redan ett konto?{" "}
            <button type="button" onClick={() => setMode("login")} style={{ ...linkStyle, display: "inline" }}>
              Logga in
            </button>
          </p>
        )}
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #33353D",
  backgroundColor: "#26282F",
  color: "#F5F6F8",
  fontSize: 14,
  boxSizing: "border-box",
};

const linkStyle = {
  background: "none",
  border: "none",
  color: "#8B6BFF",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  padding: 0,
  marginTop: 14,
  display: "block",
  textAlign: "center",
  width: "100%",
};
