import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Cloud, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DEBOUNCE_MS = 1000;

export function MemoPad() {
  const [memo, setMemo] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load note from database on mount
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("notes")
        .select("id, content")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setMemo(data.content);
        setNoteId(data.id);
      }
      setLoaded(true);
    })();
  }, []);

  const save = useCallback(async (content: string, id: string | null) => {
    setSaving(true);
    try {
      if (id) {
        await supabase.from("notes").update({ content, updated_at: new Date().toISOString() }).eq("id", id);
      } else {
        const { data } = await supabase.from("notes").insert({ content }).select("id").single();
        if (data) setNoteId(data.id);
      }
    } finally {
      setSaving(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setMemo(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(value, noteId), DEBOUNCE_MS);
  };

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <Card className="h-full">
      <CardContent className="py-4 px-5 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <StickyNote className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Quick Notes</h3>
          <span className="ml-auto">
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : loaded && noteId ? (
              <Cloud className="h-3.5 w-3.5 text-muted-foreground" />
            ) : null}
          </span>
        </div>
        <Textarea
          value={memo}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Jot down reminders, ideas, quick thoughts…"
          className="flex-1 resize-none border-dashed text-sm min-h-[200px]"
          disabled={!loaded}
        />
      </CardContent>
    </Card>
  );
}
