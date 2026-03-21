import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const cardSchema = z.object({
  name: z.string().min(1).optional(),
  brand: z.string().optional(),
  closing_day: z.number().int().min(1).max(31).optional(),
  due_day: z.number().int().min(1).max(31).optional(),
  limit_amount: z.number().positive().optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const parsed = cardSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { error, data } = await supabase
    .from("cards")
    .update(parsed.data)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
