import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote } from "lucide-react";

const STORAGE_KEY = "dashboard-memo";

export function MemoPad() {
  const [memo, setMemo] = useState(() => localStorage.getItem(STORAGE_KEY) ?? "");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, memo);
  }, [memo]);

  return (
    <Card className="h-full">
      <CardContent className="py-4 px-5 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <StickyNote className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Quick Notes</h3>
        </div>
        <Textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Jot down reminders, ideas, quick thoughts…"
          className="flex-1 resize-none border-dashed text-sm min-h-[200px]"
        />
      </CardContent>
    </Card>
  );
}
