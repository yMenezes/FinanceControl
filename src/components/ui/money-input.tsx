"use client";

import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";

type Props = {
  control: any;
  name: string;
  id?: string;
  className?: string;
  placeholder?: string;
};

export function MoneyInput({ control, name, id, className, placeholder }: Props) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const initialCents = Math.round((field.value ?? 0) * 100);
        const [cents, setCents] = useState<number>(initialCents);

        useEffect(() => {
          const v = Math.round((field.value ?? 0) * 100);
          if (v !== cents) setCents(v);
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [field.value]);

        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
            <Input
              id={id}
              inputMode="numeric"
              placeholder={placeholder ?? "0,00"}
              className={(className ?? "") + " pl-9"}
              value={
                cents === 0
                  ? ""
                  : (cents / 100).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
              }
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                const value = parseInt(digits || "0", 10);
                setCents(value);
                field.onChange(value / 100);
              }}
            />
          </div>
        );
      }}
    />
  );
}
