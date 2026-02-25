
-- Create contact_messages table for public contact form
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form)
CREATE POLICY "Anyone can submit contact message"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

-- Only admins can read/manage
CREATE POLICY "Admin manage contact messages"
ON public.contact_messages
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'::app_role));
