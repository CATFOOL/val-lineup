import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { createSupabaseClient, getUserId } from '../_shared/supabase.ts'

interface ToggleLikeRequest {
  lineup_id: string
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const userId = await getUserId(req)
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: ToggleLikeRequest = await req.json()

    if (!body.lineup_id) {
      return new Response(
        JSON.stringify({ error: 'Missing lineup_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createSupabaseClient(req)

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('lineup_likes')
      .select('id')
      .eq('lineup_id', body.lineup_id)
      .eq('user_id', userId)
      .maybeSingle()

    let liked: boolean

    if (existingLike) {
      // Unlike
      await supabase
        .from('lineup_likes')
        .delete()
        .eq('lineup_id', body.lineup_id)
        .eq('user_id', userId)
      liked = false
    } else {
      // Like
      await supabase
        .from('lineup_likes')
        .insert({
          lineup_id: body.lineup_id,
          user_id: userId,
        })
      liked = true
    }

    // Get updated count
    const { count } = await supabase
      .from('lineup_likes')
      .select('*', { count: 'exact', head: true })
      .eq('lineup_id', body.lineup_id)

    return new Response(
      JSON.stringify({ liked, count: count ?? 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
