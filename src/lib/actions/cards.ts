'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteCard(id: string) {
  const supabase = await createClient()
  await supabase
    .from('cards')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/cards')
}