"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { markInstallmentPaid } from "@/lib/actions/sales";
import type { CurrencyCode } from "@/lib/database.types";

export function InstallmentRow({
  id,
  saleId,
  number,
  dueDate,
  amount,
  currency,
  paid,
}: {
  id: string;
  saleId: string;
  number: number;
  dueDate: string;
  amount: number;
  currency: CurrencyCode;
  paid: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between rounded-md border p-2 text-sm">
      <span>
        #{number} · vence {dueDate}
      </span>
      <div className="flex items-center gap-2">
        <span>{formatCurrency(amount, currency)}</span>
        <Button
          size="sm"
          variant={paid ? "secondary" : "outline"}
          disabled={isPending}
          onClick={() =>
            startTransition(() => markInstallmentPaid(id, saleId, !paid))
          }
        >
          {paid ? "Pagada" : "Marcar pagada"}
        </Button>
      </div>
    </div>
  );
}
