import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { createSupabaseClient, getUserId } from '../_shared/supabase.ts'

interface MediaInput {
  file: string // base64
  filename: string
  type: 'image' | 'video'
  description?: string
  is_cover: boolean
}

interface CreateLineupRequest {
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

    const body: CreateLineupRequest = await req.json()

    if (!body.title || !body.agent_uuid || !body.map_uuid) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, agent_uuid, map_uuid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createSupabaseClient(req)

    // 1. Create lineup record
    const { data: lineup, error: lineupError } = await supabase
      .from('lineups')
      .insert({
        title: body.title,
        description: body.description || null,
        agent_uuid: body.agent_uuid,
        map_uuid: body.map_uuid,
        user_id: userId,
        side: body.side || null,
        site: body.site || null,
        ability: body.ability || null,
        is_published: body.is_published ?? false,
      })
      .select()
      .single()

    if (lineupError) {
      throw new Error(`Failed to create lineup: ${lineupError.message}`)
    }

    // 2. Upload media files and create records
    const mediaRecords = []
    for (let i = 0; i < (body.media || []).length; i++) {
      const item = body.media[i]
      if (!item) continue

      // Decode base64 file
      const base64Data = item.file.includes(',') ? item.file.split(',')[1] : item.file
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

      const ext = item.filename.split('.').pop() || 'jpg'
      const fileName = `${userId}/${lineup.id}/${i}.${ext}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('lineup-media')
        .upload(fileName, binaryData, {
          contentType: item.type === 'video' ? 'video/mp4' : 'image/jpeg',
        })

      if (uploadError) {
        // Rollback: delete the lineup
        await supabase.from('lineups').delete().eq('id', lineup.id)
        throw new Error(`Failed to upload media: ${uploadError.message}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('lineup-media')
        .getPublicUrl(fileName)

      mediaRecords.push({
        lineup_id: lineup.id,
        media_type: item.type,
        url: urlData.publicUrl,
        description: item.description || null,
        sort_order: i,
        is_cover: item.is_cover,
      })
    }

    // 3. Insert media records
    if (mediaRecords.length > 0) {
      const { error: mediaError } = await supabase
        .from('lineup_media')
        .insert(mediaRecords)

      if (mediaError) {
        // Rollback: delete lineup and uploaded files
        await supabase.from('lineups').delete().eq('id', lineup.id)
        for (let i = 0; i < mediaRecords.length; i++) {
          const ext = body.media[i]?.filename.split('.').pop() || 'jpg'
          await supabase.storage.from('lineup-media').remove([`${userId}/${lineup.id}/${i}.${ext}`])
        }
        throw new Error(`Failed to create media records: ${mediaError.message}`)
      }
    }

    return new Response(
      JSON.stringify({ lineup_id: lineup.id }),
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
