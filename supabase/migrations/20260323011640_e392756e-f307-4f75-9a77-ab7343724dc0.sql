
-- Add user_id to projects
ALTER TABLE public.projects ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to tasks
ALTER TABLE public.tasks ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to notes
ALTER TABLE public.notes ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all access to projects" ON public.projects;
DROP POLICY IF EXISTS "Allow all access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow all access to notes" ON public.notes;

-- Projects: users can only CRUD their own
CREATE POLICY "Users can manage own projects" ON public.projects FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tasks: users can only CRUD their own
CREATE POLICY "Users can manage own tasks" ON public.tasks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notes: users can only CRUD their own
CREATE POLICY "Users can manage own notes" ON public.notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
