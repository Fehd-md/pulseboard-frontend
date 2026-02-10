import { useEffect, useMemo, useState } from "react";
import type { Card, CardStatus, CardType } from "./types";
import { createCard, deleteCard, getCards, patchCard } from "./api";
import logo from "./assets/pulselogo.png";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  LayoutDashboard,
  Plus,
  RefreshCw,
  Search,
  Tag,
  CheckCircle2,
  Loader2,
  Trash2
} from "lucide-react";

const COLS: { key: CardStatus; label: string; hint: string }[] = [
  { key: "todo", label: "À faire", hint: "Tout ce qui attend" },
  { key: "doing", label: "En cours", hint: "En train de bouger" },
  { key: "done", label: "Fait", hint: "Terminé ✅" }
];

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

function ColumnShell(props: {
  title: string;
  hint: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-900/30 shadow-[0_0_0_1px_rgba(56,189,248,0.05)]">
      <div className="p-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{props.title}</h3>
          <p className="text-xs text-slate-400">{props.hint}</p>
        </div>
        <span className="rounded-full border border-slate-800 bg-slate-950/50 px-2 py-1 text-xs text-slate-300">
          {props.count}
        </span>
      </div>
      <div className="px-3 pb-3">{props.children}</div>
    </div>
  );
}

function TagPill({ t }: { t: string }) {
  return (
    <span className="rounded-full border border-slate-800 bg-slate-950/40 px-2 py-1 text-[11px] text-sky-200/90">
      #{t}
    </span>
  );
}

function CardTile({
  card,
  isOverlay,
  onDelete
}: {
  card: Card;
  isOverlay?: boolean;
  onDelete: (id: number) => void;
}) {
  const typeBadge =
    card.type === "task"
      ? "bg-sky-500/15 text-sky-200 border-sky-500/20"
      : card.type === "note"
      ? "bg-violet-500/15 text-violet-200 border-violet-500/20"
      : "bg-emerald-500/15 text-emerald-200 border-emerald-500/20";

  return (
    <div
      className={cx(
        "rounded-2xl border border-slate-800 bg-slate-950/40 p-3 transition",
        !isOverlay && "hover:border-sky-700/40 hover:bg-slate-950/55",
        isOverlay && "shadow-2xl border-sky-600/30 bg-slate-950/70"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cx("shrink-0 rounded-full border px-2 py-0.5 text-[11px]", typeBadge)}>
              {card.type.toUpperCase()}
            </span>
            <div className="truncate text-sm font-semibold">{card.title}</div>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            maj {new Date(card.updatedAt).toLocaleString()}
          </div>
        </div>

        <button
          onClick={() => onDelete(card.id)}
          className="shrink-0 rounded-xl border border-slate-800 bg-slate-950/30 px-2 py-1 text-xs hover:bg-slate-950/70"
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {card.content ? (
        <p className="mt-2 text-sm text-slate-200/90 whitespace-pre-wrap">
          {card.content}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-1">
        {card.tags?.map((t) => (
          <TagPill key={t} t={t} />
        ))}
      </div>
    </div>
  );
}

function SortableCard({
  card,
  onDelete
}: {
  card: Card;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: card.id,
      data: { status: card.status }
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div ref={setNodeRef} style={style} className={cx(isDragging && "opacity-40")}>
      <div
        className="cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <CardTile card={card} onDelete={onDelete} />
      </div>
    </div>
  );
}

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [type, setType] = useState<CardType | "all">("all");
  const [tag, setTag] = useState("");

  // form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [newType, setNewType] = useState<CardType>("task");

  // DnD
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function refresh(params?: Record<string, string>) {
    setLoading(true);
    setErr(null);
    try {
      const data = await getCards(params);
      setCards(data);
    } catch (e: any) {
      setErr(e?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    cards.forEach((c) => c.tags?.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [cards]);

  const byStatus = useMemo(() => {
    const map: Record<CardStatus, Card[]> = { todo: [], doing: [], done: [] };
    cards.forEach((c) => map[c.status].push(c));
    return map;
  }, [cards]);

  const activeCard = useMemo(
    () => cards.find((c) => c.id === activeId) ?? null,
    [cards, activeId]
  );

  async function onApplyFilters() {
    await refresh({
      ...(q ? { q } : {}),
      ...(type !== "all" ? { type } : {}),
      ...(tag ? { tag } : {})
    });
  }

  async function onAdd() {
    if (!title.trim()) return;

    const tagsArr = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 12);

    const created = await createCard({
      title: title.trim(),
      content: content.trim() || undefined,
      type: newType,
      status: "todo",
      tags: tagsArr
    });

    setTitle("");
    setContent("");
    setCards((prev) => [created, ...prev]);
  }

  async function onDelete(id: number) {
    await deleteCard(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  // Util: find column id under pointer (we use droppable areas via IDs "col:todo" etc)
  function colId(status: CardStatus) {
    return `col:${status}`;
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);

    if (!over) return;

    const activeCardId = Number(active.id);
    const overId = String(over.id);

    const current = cards.find((c) => c.id === activeCardId);
    if (!current) return;

    let targetStatus: CardStatus | null = null;

    // Drop on column shell
    if (overId.startsWith("col:")) {
      targetStatus = overId.replace("col:", "") as CardStatus;
    } else {
      // Drop on another card => same column as that card
      const overCard = cards.find((c) => c.id === Number(overId));
      if (overCard) targetStatus = overCard.status;
    }

    if (!targetStatus || targetStatus === current.status) return;

    // Optimistic UI
    setCards((prev) =>
      prev.map((c) => (c.id === activeCardId ? { ...c, status: targetStatus! } : c))
    );

    try {
      const updated = await patchCard(activeCardId, { status: targetStatus });
      setCards((prev) => prev.map((c) => (c.id === activeCardId ? updated : c)));
    } catch (err) {
      // rollback
      setCards((prev) =>
        prev.map((c) => (c.id === activeCardId ? { ...c, status: current.status } : c))
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="PulseBoard"
               className="h-10 w-10 rounded-2xl object-contain"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight">PulseBoard</h1>
              <p className="text-sm text-slate-400">Tableau de bord personnel et/ou profesionnel | free to use</p>
            </div>
          </div>

          <button
            onClick={() => refresh()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm hover:bg-slate-900"
          >
            <RefreshCw className="h-4 w-4" />
            Rafraîchir
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="rounded-3xl border border-slate-800 bg-slate-900/25 p-4 h-fit">
          <div className="flex items-center gap-2 text-slate-200">
            <LayoutDashboard className="h-5 w-5 text-sky-300" />
            <h2 className="font-semibold">Dashboard</h2>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
              <div className="text-xs text-slate-400">Total cards</div>
              <div className="mt-1 text-2xl font-bold">{cards.length}</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
              <div className="text-xs text-slate-400">Tags</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {allTags.slice(0, 10).map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-950/40 px-2 py-1 text-[11px] text-slate-200">
                    <Tag className="h-3 w-3 text-sky-300" /> {t}
                  </span>
                ))}
                {allTags.length === 0 ? <span className="text-xs text-slate-500">aucun</span> : null}
              </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-300" />
                <div className="text-sm font-semibold">Recherche</div>
              </div>

              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Titre, contenu…"
                className="mt-3 w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-sky-600/60 focus:ring-2 focus:ring-sky-600/20"
              />

              <div className="mt-3 grid gap-2">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-sky-600/60 focus:ring-2 focus:ring-sky-600/20"
                >
                  <option value="all">Tous les types</option>
                  <option value="task">Tâches</option>
                  <option value="note">Notes</option>
                  <option value="goal">Objectifs</option>
                </select>

                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-sky-600/60 focus:ring-2 focus:ring-sky-600/20"
                >
                  <option value="">Tous les tags</option>
                  {allTags.map((t) => (
                    <option key={t} value={t}>
                      #{t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={onApplyFilters}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:opacity-95"
                >
                  Appliquer
                </button>
                <button
                  onClick={() => {
                    setQ("");
                    setType("all");
                    setTag("");
                    refresh();
                  }}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm hover:bg-slate-950/70"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <section className="space-y-6">
          {/* Create */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-4 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Ajouter une card</h2>
                <p className="text-sm text-slate-400">Ajout express, pour rester dans le flow.</p>
              </div>

              <button
                onClick={onAdd}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:opacity-95"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre (ex: Fix DNS, Préparer entretien…) "
                className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 outline-none focus:border-sky-600/60 focus:ring-2 focus:ring-sky-600/20"
              />

              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as CardType)}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 outline-none focus:border-sky-600/60 focus:ring-2 focus:ring-sky-600/20"
              >
                <option value="task">Tâche</option>
                <option value="note">Note</option>
                <option value="goal">Objectif</option>
              </select>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Contenu (optionnel)…"
                className="md:col-span-3 min-h-[96px] rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 outline-none focus:border-sky-600/60 focus:ring-2 focus:ring-sky-600/20"
              />

              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags (ex: Pro, Perso, Urgent)"
                className="md:col-span-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 outline-none focus:border-sky-600/60 focus:ring-2 focus:ring-sky-600/20"
              />
            </div>

            {err ? (
              <p className="mt-4 rounded-2xl border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
                {err}
              </p>
            ) : null}
          </div>

          {/* Kanban with DnD */}
          <DndContext
            sensors={sensors}
            onDragStart={(e) => setActiveId(Number(e.active.id))}
            onDragEnd={onDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <div className="grid gap-4 lg:grid-cols-3">
              {COLS.map((col) => (
                <DroppableColumn key={col.key} id={colId(col.key)}>
                  <ColumnShell
                    title={col.label}
                    hint={col.hint}
                    count={byStatus[col.key].length}
                  >
                    <SortableContext
                      items={byStatus[col.key].map((c) => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {byStatus[col.key].map((card) => (
                          <SortableCard key={card.id} card={card} onDelete={onDelete} />
                        ))}
                        {byStatus[col.key].length === 0 ? (
                          <div className="rounded-2xl border border-slate-800 border-dashed bg-slate-950/20 p-6 text-center text-sm text-slate-400">
                            Dépose une card ici 👇
                          </div>
                        ) : null}
                      </div>
                    </SortableContext>
                  </ColumnShell>
                </DroppableColumn>
              ))}
            </div>

            <DragOverlay>
              {activeCard ? <CardTile card={activeCard} isOverlay onDelete={() => {}} /> : null}
            </DragOverlay>
          </DndContext>

          <div className="flex items-center justify-between text-xs text-slate-500 pb-8">
            <span className="inline-flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {loading ? "Sync…" : "Ready"}
            </span>
            <span>PulseBoard — build par Fehd-md, votre fidèle admin sys</span>
          </div>
        </section>
      </main>
    </div>
  );
}

// Droppable area for each column
import { useDroppable } from "@dnd-kit/core";
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cx(
        "rounded-3xl",
        isOver && "ring-2 ring-sky-600/25"
      )}
    >
      {children}
    </div>
  );
}
