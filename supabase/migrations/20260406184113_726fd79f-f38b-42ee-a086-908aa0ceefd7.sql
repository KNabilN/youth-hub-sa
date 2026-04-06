ALTER TABLE public.discount_code_usages 
ADD CONSTRAINT discount_code_usages_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id);