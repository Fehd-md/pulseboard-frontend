export type CardType = "task" | "note" | "goal";
export type CardStatus = "todo" | "doing" | "done";

export type Card = {
  id: number;
  title: string;
  content?: string | null;
  type: CardType;
  status: CardStatus;
  tags: string[];
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
};
