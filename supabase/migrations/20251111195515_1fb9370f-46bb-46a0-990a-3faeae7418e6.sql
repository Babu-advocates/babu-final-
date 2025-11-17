-- Create gallery_images table to manage gallery photos with ordering
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES admin_accounts(id)
);

-- Enable RLS
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can create gallery images"
  ON public.gallery_images
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can update gallery images"
  ON public.gallery_images
  FOR UPDATE
  USING (true);

CREATE POLICY "Admin can delete gallery images"
  ON public.gallery_images
  FOR DELETE
  USING (true);

CREATE POLICY "Anyone can view gallery images"
  ON public.gallery_images
  FOR SELECT
  USING (true);

-- Create index for ordering
CREATE INDEX idx_gallery_images_order ON public.gallery_images(display_order);

-- Create trigger for updated_at
CREATE TRIGGER update_gallery_images_updated_at
  BEFORE UPDATE ON public.gallery_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();