import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { createSupabaseClient, getUserId } from '../_shared/supabase.ts'

interface MediaInput {
  id?: string // existing media id
  file?: string // base64 for new files
  filename?: string
  type: 'image' | 'video'
  description?: string
  is_cover: boolean
  sort_order: number
}

interface UpdateLineupRequest {
  lineup_id: string
  title: string
  description?: string
  agent_uuid: string
  map_uuid: string
  side?: 'attack' | 'defense'
  site?: string
  ability?: string
  is_published: boolean
  media: MediaInput[]
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

    const body: UpdateLineupRequest = await req.json()

    if (!body.lineup_id || !body.title || !body.agent_uuid || !body.map_uuid) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createSupabaseClient(req)

    // Verify ownership
    const { data: existing } = await supabase
      .from('lineups')
      .select('user_id')
      .eq('id', body.lineup_id)
      .single()

    if (!existing || existing.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Not found or not authorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Update lineup record
    const { error: updateError } = await supabase
      .from('lineups')
      .update({
        title: body.title,
        description: body.description || null,
        agent_uuid: body.agent_uuid,
        map_uuid: body.map_uuid,
        side: body.side || null,
        site: body.site || null,
        ability: body.ability || null,
        is_published: body.is_published,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.lineup_id)

    if (updateError) {
      throw new Error(`Failed to update lineup: ${updateError.message}`)
    }

    // 2. Get current media to determine what to delete
    const { data: currentMedia } = await supabase
      .from('lineup_media')
      .select('id, url')
      .eq('lineup_id', body.lineup_id)

    const existingIds = body.media.filter(m => m.id).map(m => m.id)
    const toDelete = (currentMedia ?? []).filter(m => !existingIds.includes(m.id))

    // 3. Delete removed media records and files
    for (const m of toDelete) {
      await supabase.from('lineup_media').delete().eq('id', m.id)
      // Extract file path from URL and delete from storage
      const urlPath = new URL(m.url).pathname
      const storagePath = urlPath.split('/lineup-media/')[1]
      if (storagePath) {
        await supabase.storage.from('lineup-media').remove([storagePath])
      }
    }

    // 4. Update existing and insert new media
    for (const item of body.media) {
      if (item.id) {
        // Update existing media
        await supabase
          .from('lineup_media')
          .update({
            sort_order: item.sort_order,
            description: item.description || null,
            is_cover: item.is_cover,
          })
          .eq('id', item.id)
      } else if (item.file && item.filename) {
        // Upload new media
        const base64Data = item.file.includes(',') ? item.file.split(',')[1] : item.file
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

        const ext = item.filename.split('.').pop() || 'jpg'
        const fileName = `${userId}/${body.lineup_id}/${Date.now()}-${item.sort_order}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('lineup-media')
          .upload(fileName, binaryData, {
            contentType: item.type === 'video' ? 'video/mp4' : 'image/jpeg',
          })

        if (uploadError) {
          throw new Error(`Failed to upload media: ${uploadError.message}`)
        }

        const { data: urlData } = supabase.storage
          .from('lineup-media')
          .getPublicUrl(fileName)

        await supabase.from('lineup_media').insert({
          lineup_id: body.lineup_id,
          media_type: item.type,
          url: urlData.publicUrl,
          description: item.description || null,
          sort_order: item.sort_order,
          is_cover: item.is_cover,
        })
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
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
