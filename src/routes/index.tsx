import { createFileRoute } from "@tanstack/react-router";
import { Board } from "@/components/kanban/board";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Board />;
}
