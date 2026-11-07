/** Management credentials stay in this Node process, never browser code or logs. */
export function managementClient() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const ref = process.env.SUPABASE_TARGET_REF;
  if (!token || !ref || !/^[a-z]{20}$/.test(ref)) throw new Error("A management token and an explicit SUPABASE_TARGET_REF are required.");
  const api = async (path, { method = "GET", body, form } = {}) => {
    const response = await fetch(`https://api.supabase.com/v1/projects/${ref}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(!form && body ? { "Content-Type": "application/json" } : {}) },
      body: form || (body ? JSON.stringify(body) : undefined),
    });
    if (!response.ok) throw new Error(`Supabase management ${method} ${path.split("?")[0]} failed (${response.status}).`);
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  };
  const query = (sql) => api("/database/query", { method: "POST", body: { query: sql } });
  return { api, query, ref };
}
