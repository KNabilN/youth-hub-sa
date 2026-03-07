ALTER TABLE public.bid_comments ADD CONSTRAINT bid_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.bid_comments;