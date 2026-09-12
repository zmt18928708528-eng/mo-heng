import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COLUMN_META, type ColumnId, type KanbanCard } from "@/lib/kanban/types";

export type CardEditor =
  | { mode: "closed" }
  | { mode: "create"; columnId: ColumnId }
  | { mode: "edit"; card: KanbanCard };

type CardDialogProps = {
  editor: CardEditor;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
};

export function CardDialog({ editor, onClose, onSave }: CardDialogProps) {
  const open = editor.mode !== "closed";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (editor.mode === "create") {
      setTitle("");
      setDescription("");
    } else if (editor.mode === "edit") {
      setTitle(editor.card.title);
      setDescription(editor.card.description);
    }
  }, [editor]);

  const heading =
    editor.mode === "create"
      ? `添加到${COLUMN_META[editor.columnId].title}`
      : "编辑卡片";

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) return;
    onSave(nextTitle, description.trim());
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{heading}</DialogTitle>
            <DialogDescription>
              填写标题，描述可选。拖动卡片即可在列之间移动。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="card-title">标题</Label>
              <Input
                id="card-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="这张卡片要做什么"
                autoComplete="off"
                required
                maxLength={80}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="card-desc">描述</Label>
              <Textarea
                id="card-desc"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="补充背景、步骤或截止时间"
                maxLength={400}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
