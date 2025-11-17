-- Create application_types table
CREATE TABLE IF NOT EXISTS public.application_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.application_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for application_types
CREATE POLICY "Allow admin to view application types"
  ON public.application_types
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin to create application types"
  ON public.application_types
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow admin to update application types"
  ON public.application_types
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow admin to delete application types"
  ON public.application_types
  FOR DELETE
  TO public
  USING (true);

-- Insert existing application types from the codebase
INSERT INTO public.application_types (name) VALUES
  ('legal opinion'),
  ('vetting report'),
  ('supplementary opinion'),
  ('MODT'),
  ('check handover'),
  ('EC'),
  ('sale deed draft'),
  ('DD handover'),
  ('MODT draft'),
  ('legal audit'),
  ('premises'),
  ('2nd vetting')
ON CONFLICT (name) DO NOTHING;

-- Create trigger for updating updated_at
CREATE TRIGGER update_application_types_updated_at
  BEFORE UPDATE ON public.application_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();