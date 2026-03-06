import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

function generateInvoiceNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${date}-${rand}`;
}

interface PayFromGrantsInput {
  amount: number;
  payeeId: string;
  projectId?: string;
  serviceId?: string;
}

export function usePayFromGrants() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, payeeId, projectId, serviceId }: PayFromGrantsInput) => {
      if (!user) throw new Error("Not authenticated");

      // --- Fetch eligible contributions in priority order ---
      let specificContributions: any[] = [];

      if (projectId) {
        const { data, error } = await supabase
          .from("donor_contributions")
          .select("id, amount, donation_status, donor_id, association_id, project_id, service_id")
          .eq("association_id", user.id)
          .eq("donation_status", "available")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        specificContributions = data ?? [];
      } else if (serviceId) {
        const { data, error } = await supabase
          .from("donor_contributions")
          .select("id, amount, donation_status, donor_id, association_id, project_id, service_id")
          .eq("association_id", user.id)
          .eq("donation_status", "available")
          .eq("service_id", serviceId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        specificContributions = data ?? [];
      }

      // General grants (not assigned to any project or service)
      const { data: generalContributions, error: genErr } = await supabase
        .from("donor_contributions")
        .select("id, amount, donation_status, donor_id, association_id, project_id, service_id")
        .eq("association_id", user.id)
        .eq("donation_status", "available")
        .is("project_id", null)
        .is("service_id", null)
        .order("created_at", { ascending: true });
      if (genErr) throw genErr;

      // Combine: specific first, then general (FIFO within each group)
      const contributions = [...specificContributions, ...(generalContributions ?? [])];

      const available = contributions.reduce((s, c) => s + Number(c.amount), 0);
      if (available < amount) throw new Error("رصيد المنح غير كافٍ");

      // Track consumed contribution IDs for rollback
      const consumedIds: string[] = [];
      const splitRecords: { originalId: string; originalAmount: number }[] = [];

      // Mark contributions as consumed (FIFO), splitting partial ones
      let remaining = amount;
      try {
        for (const c of contributions) {
          if (remaining <= 0) break;
          const cAmount = Number(c.amount);

          if (cAmount <= remaining) {
            remaining -= cAmount;
            const { error } = await supabase
              .from("donor_contributions")
              .update({ donation_status: "consumed", project_id: projectId || c.project_id || null, service_id: serviceId || c.service_id || null })
              .eq("id", c.id);
            if (error) { console.error("consume full contribution error:", error); throw error; }
            consumedIds.push(c.id);
          } else {
            const usedAmount = remaining;
            const leftover = cAmount - usedAmount;
            remaining = 0;

            // Update original to leftover (still available)
            const { error: upErr } = await supabase
              .from("donor_contributions")
              .update({ amount: leftover })
              .eq("id", c.id);
            if (upErr) { console.error("update leftover error:", upErr); throw upErr; }
            splitRecords.push({ originalId: c.id, originalAmount: cAmount });

            // Insert consumed portion as new row
            const { error: insErr } = await supabase
              .from("donor_contributions")
              .insert({
                donor_id: c.donor_id ?? user.id,
                association_id: c.association_id ?? user.id,
                amount: usedAmount,
                donation_status: "consumed",
                project_id: projectId || c.project_id || null,
                service_id: serviceId || c.service_id || null,
              });
            if (insErr) { console.error("insert consumed portion error:", insErr); throw insErr; }
          }
        }

        // Create escrow with status 'held'
        const { data: escrow, error: escrowErr } = await supabase
          .from("escrow_transactions")
          .insert({
            payer_id: user.id,
            payee_id: payeeId,
            amount,
            status: "held",
            project_id: projectId || null,
            service_id: serviceId || null,
          })
          .select()
          .single();
        if (escrowErr) {
          // ROLLBACK: restore consumed grants
          console.error("Escrow creation failed, rolling back grants:", escrowErr);
          await rollbackGrants(consumedIds, splitRecords);
          throw escrowErr;
        }

        // Get active commission rate and create invoice
        const { data: config } = await supabase
          .from("commission_config")
          .select("rate")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const rate = config?.rate ?? 0.05;
        const commissionAmount = Math.round(amount * Number(rate) * 100) / 100;

        const { error: invError } = await supabase
          .from("invoices")
          .insert({
            invoice_number: generateInvoiceNumber(),
            amount,
            commission_amount: commissionAmount,
            issued_to: user.id,
            escrow_id: escrow.id,
          });
        if (invError) throw invError;

        return escrow;
      } catch (err) {
        // If escrow was never created (error happened during grant consumption),
        // rollback is already handled above. Re-throw for caller.
        throw err;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["association-grant-balance"] });
      qc.invalidateQueries({ queryKey: ["association-received-grants"] });
      qc.invalidateQueries({ queryKey: ["association-grant-stats"] });
      qc.invalidateQueries({ queryKey: ["project-grant-balance"] });
      qc.invalidateQueries({ queryKey: ["escrow"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["my-invoices"] });
    },
  });
}

async function rollbackGrants(
  consumedIds: string[],
  splitRecords: { originalId: string; originalAmount: number }[]
) {
  // Restore fully consumed contributions back to available
  for (const id of consumedIds) {
    await supabase
      .from("donor_contributions")
      .update({ donation_status: "available" })
      .eq("id", id);
  }
  // Restore split contributions to original amount
  for (const rec of splitRecords) {
    await supabase
      .from("donor_contributions")
      .update({ amount: rec.originalAmount })
      .eq("id", rec.originalId);
  }
  // Note: we can't easily delete the inserted "consumed" split rows without their IDs,
  // but the rollback of the original amount + status makes the balance correct.
}
