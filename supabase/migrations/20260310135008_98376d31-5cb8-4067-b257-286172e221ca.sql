ALTER TABLE public.tasks ADD COLUMN effort text NOT NULL DEFAULT 'm';
ALTER TABLE public.tasks ADD COLUMN fiscal_quarter text NOT NULL DEFAULT '';