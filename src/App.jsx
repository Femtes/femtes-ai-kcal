import React, { useEffect, useState } from "react";
import Portion, { APP_VERSION } from "./Portion.jsx";
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
        style={{ width: "100%", maxWidth: 360, backgroundColor: "#1C1E24", borderRadius: 16, padding: 28, position: "relative" }}
      >
        <span
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            fontSize: 10,
            color: "#8B8D97",
            opacity: 0.6,
          }}
        >
          v{APP_VERSION}
        </span>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 14px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#8DC63F",
              backgroundColor: "rgba(141, 198, 63, 0.14)",
              border: "1px solid rgba(141, 198, 63, 0.4)",
              boxShadow: "0 0 14px rgba(141, 198, 63, 0.35)",
            }}
          >
            🧪 BETA
          </span>
        </div>

        <img
          src="/logo.png"
          alt="Calio Bite"
          style={{ width: "100%", maxWidth: 280, display: "block", margin: "0 auto 8px" }}
        />
        <p style={{ fontSize: 13, color: "#8B8D97", marginBottom: 8, textAlign: "center" }}>
          {mode === "login" ? "Logga in på ditt konto" : "Skapa ett nytt konto"}
        </p>
        <p style={{ fontSize: 11, color: "#8B8D97", marginBottom: 20, textAlign: "center", opacity: 0.8 }}>
          Appen är under betatest — du kan stöta på buggar, och funktioner kan ändras.
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
            backgroundColor: "#8DC63F",
            color: "#14180D",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "Ett ögonblick …" : mode === "login" ? "Logga in" : "Registrera"}
        </button>

        {mode === "register" && (
          <p style={{ fontSize: 11, color: "#8B8D97", marginTop: 10, textAlign: "center", lineHeight: 1.5 }}>
            By creating an account, you agree to our Terms and Disclaimer.
          </p>
        )}

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

        <p style={{ fontSize: 11, color: "#5A5C66", marginTop: 24, textAlign: "center" }}>
          © {new Date().getFullYear()} Femtes. Alla rättigheter förbehållna.
        </p>
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
  color: "#8DC63F",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  padding: 0,
  marginTop: 14,
  display: "block",
  textAlign: "center",
  width: "100%",
};
