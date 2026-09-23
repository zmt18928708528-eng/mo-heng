import { createFileRoute } from "@tanstack/react-router";
import { Board } from "@/components/kanban/board";
import { LockGate } from "@/components/lock/lock-gate";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <LockGate>
      <Board />
    </LockGate>
  );
}
