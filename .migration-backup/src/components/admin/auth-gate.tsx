"use client";

import { useEffect, useState } from "react";
import { LockKey, ArrowRight, SignOut } from "@phosphor-icons/react";
import { getSupabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/cms";
import styles from "./cms.module.css";

export function AdminAuth({ children }: { children: React.ReactNode }) {
  const [access, setAccess] = useState<"loading" | "login" | "denied" | "admin">("loading");
  const [mode, setMode] = useState<"login" | "reset" | "password">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const client = getSupabase();
    const check = async () => {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (!active) return;
        if (!session) { setAccess("login"); return; }
        const { data, error } = await client.rpc("is_portfolio_admin");
        if (active) { setAccess(data === true && !error ? "admin" : "denied"); if (error) setError(error.message); }
      } catch (error) { if (active) { setAccess("login"); setError(errorMessage(error)); } }
    };
    void check();
    const { data: { subscription } } = client.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("password");
      // Leave the auth callback before requesting another token-backed operation.
      if (["SIGNED_IN", "SIGNED_OUT", "TOKEN_REFRESHED", "USER_UPDATED", "PASSWORD_RECOVERY"].includes(event)) setTimeout(() => { if (active) void check(); }, 0);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const client = getSupabase();
      if (mode === "password") {
        const { error } = await client.auth.updateUser({ password }); if (error) throw error;
        setPassword(""); setMode("login"); setNotice("Password updated.");
      } else if (mode === "reset") {
        const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/admin` });
        if (error) throw error;
        setNotice("If this account exists, a password-reset link has been sent.");
      } else {
        const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error; setPassword("");
      }
    } catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  if (access === "admin" && mode !== "password") return <>{children}</>;
  return <div className={styles.authPage}><div className={styles.authCard}>
    <a className={styles.authBrand} href="/" target="_blank" rel="noreferrer">YK<span>.</span></a>
    <div className={styles.lock}><LockKey size={28} /></div>
    <p className={styles.eyebrow}>PRIVATE WORKSPACE</p>
    <h1>{access === "loading" ? "Checking your session…" : access === "denied" ? "Administrator access required" : mode === "reset" ? "Reset your password" : mode === "password" ? "Choose a new password" : "Welcome back."}</h1>
    <p className={styles.muted}>{access === "denied" ? "This verified account is not on the administrator list. Sign in with the approved email." : "Sign in to manage your portfolio, images, messages, and project requests."}</p>
    {error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}
    {access === "denied" ? <button className={styles.button} onClick={async () => { await getSupabase().auth.signOut(); setError(""); }}><SignOut size={16} />Sign out</button> : access !== "loading" && <form onSubmit={submit}>
      {mode !== "password" && <label className={styles.field}>Email<input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>}
      {mode !== "reset" && <label className={styles.field}>Password<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 1 : 12} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>}
      <button className={styles.primary} disabled={busy}>{busy ? "Please wait…" : mode === "reset" ? "Send reset link" : mode === "password" ? "Save password" : "Sign in"}<ArrowRight size={16} /></button>
    </form>}
    {access === "login" && <div className={styles.authLinks}>{mode !== "login" ? <button onClick={() => { setMode("login"); setError(""); setNotice(""); }}>Back to sign in</button> : <button onClick={() => setMode("reset")}>Forgot password?</button>}</div>}
    <small className={styles.hint}>Access is checked by the server. Public visitors cannot read your inbox or change content.</small>
  </div></div>;
}
