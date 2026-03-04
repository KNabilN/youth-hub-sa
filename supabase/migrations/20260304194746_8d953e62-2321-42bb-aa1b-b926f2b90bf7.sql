ALTER TABLE public.withdrawal_requests
  ADD CONSTRAINT withdrawal_requests_provider_id_fkey
  FOREIGN KEY (provider_id) REFERENCES public.profiles(id);