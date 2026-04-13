
CREATE TABLE public.focus_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_id)
);

ALTER TABLE public.focus_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own focus tasks"
  ON public.focus_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus tasks"
  ON public.focus_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus tasks"
  ON public.focus_tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
