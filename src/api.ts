import type { Card } from "./types";

const API = (import.meta.env.VITE_API_URL as string) || "http://localhost:4000";

function mustOk(r: Response, msg: string) {
  if (!r.ok) throw new Error(`${msg} (${r.status})`);
  return r;
}

export async function getCards(params?: Record<string, string>) {
  const url = new URL("/cards", API); // ✅ safe
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url.toString());
  mustOk(r, "Failed to fetch cards");
  return (await r.json()) as Card[];
}

export async function createCard(payload: Partial<Card> & { title: string }) {
  const r = await fetch(new URL("/cards", API).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  mustOk(r, "Failed to create card");
  return (await r.json()) as Card;
}

export async function patchCard(id: number, payload: Partial<Card>) {
  const r = await fetch(new URL(`/cards/${id}`, API).toString(), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  mustOk(r, "Failed to update card");
  return (await r.json()) as Card;
}

export async function deleteCard(id: number) {
  const r = await fetch(new URL(`/cards/${id}`, API).toString(), { method: "DELETE" });
  if (!r.ok && r.status !== 204) throw new Error(`Failed to delete card (${r.status})`);
}
