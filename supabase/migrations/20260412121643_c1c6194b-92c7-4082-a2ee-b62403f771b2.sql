ALTER TABLE public.ticket_replies
  ADD CONSTRAINT ticket_replies_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;