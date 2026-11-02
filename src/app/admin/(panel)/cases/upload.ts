export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message);
  return d.url;
}
