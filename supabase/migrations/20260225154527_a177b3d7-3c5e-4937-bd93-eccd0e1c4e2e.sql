
-- Add donation_status to donor_contributions for tracking fund states
ALTER TABLE public.donor_contributions
  ADD COLUMN donation_status text NOT NULL DEFAULT 'available';

-- Add comment explaining valid values
COMMENT ON COLUMN public.donor_contributions.donation_status IS 'available, reserved, consumed, suspended, expired';

-- Add association_id to donor_contributions for direct association targeting
ALTER TABLE public.donor_contributions
  ADD COLUMN association_id uuid REFERENCES public.profiles(id);
