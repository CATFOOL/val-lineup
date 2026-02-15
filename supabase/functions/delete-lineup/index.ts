import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { createSupabaseClient, getUserId } from '../_shared/supabase.ts'

interface DeleteLineupRequest {
  lineup_id: string
}

Deno.serve(async req => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const userId = await getUserId(req)
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: DeleteLineupRequest = await req.json()

    if (!body.lineup_id) {
      return new Response(JSON.stringify({ error: 'Missing lineup_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createSupabaseClient(req)

    // Verify ownership
    const { data: lineup } = await supabase
      .from('lineups')
      .select('user_id')
      .eq('id', body.lineup_id)
      .single()

    if (!lineup || lineup.user_id !== userId) {
      return new Response(JSON.stringify({ error: 'Not found or not authorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Get all media files to delete from storage
    const { data: mediaFiles } = await supabase
      .from('lineup_media')
      .select('url')
      .eq('lineup_id', body.lineup_id)

    // 2. Delete media files from storage
    for (const m of mediaFiles ?? []) {
      const urlPath = new URL(m.url).pathname
      const storagePath = urlPath.split('/lineup-media/')[1]
      if (storagePath) {
        await supabase.storage.from('lineup-media').remove([storagePath])
      }
    }

    // 3. Delete lineup (cascade will delete media records, likes, bookmarks)
    const { error: deleteError } = await supabase.from('lineups').delete().eq('id', body.lineup_id)

    if (deleteError) {
      throw new Error(`Failed to delete lineup: ${deleteError.message}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
