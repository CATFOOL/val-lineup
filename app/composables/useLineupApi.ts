interface MediaInput {
  file?: string // base64
  filename?: string
  type: 'image' | 'video'
  description?: string
  is_cover: boolean
}

interface MediaInputWithId extends MediaInput {
  id?: string
  sort_order: number
}

interface CreateLineupParams {
  title: string
  description?: string
  agent_uuid: string
  map_uuid: string
  side?: 'attack' | 'defense' | ''
  site?: string
  ability?: string
  is_published: boolean
  media: MediaInput[]
}

interface UpdateLineupParams {
  lineup_id: string
  title: string
  description?: string
  agent_uuid: string
  map_uuid: string
  side?: 'attack' | 'defense' | ''
  site?: string
  ability?: string
  is_published: boolean
  media: MediaInputWithId[]
}

export function useLineupApi() {
  const supabase = useSupabaseClient()

  async function getAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  async function invokeFunction<T>(name: string, body: object): Promise<T> {
    const token = await getAccessToken()
    if (!token) {
      throw new Error('Not authenticated')
    }

    const { data, error } = await supabase.functions.invoke(name, {
      body,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (error) {
      throw new Error(error.message || 'Function call failed')
    }

    if (data?.error) {
      throw new Error(data.error)
    }

    return data as T
  }

  async function createLineup(params: CreateLineupParams): Promise<{ lineup_id: string }> {
    return invokeFunction<{ lineup_id: string }>('create-lineup', {
      title: params.title,
      description: params.description || null,
      agent_uuid: params.agent_uuid,
      map_uuid: params.map_uuid,
      side: params.side || null,
      site: params.site || null,
      ability: params.ability || null,
      is_published: params.is_published,
      media: params.media,
    })
  }

  async function updateLineup(params: UpdateLineupParams): Promise<{ success: boolean }> {
    return invokeFunction<{ success: boolean }>('update-lineup', {
      lineup_id: params.lineup_id,
      title: params.title,
      description: params.description || null,
      agent_uuid: params.agent_uuid,
      map_uuid: params.map_uuid,
      side: params.side || null,
      site: params.site || null,
      ability: params.ability || null,
      is_published: params.is_published,
      media: params.media,
    })
  }

  async function deleteLineup(lineupId: string): Promise<{ success: boolean }> {
    return invokeFunction<{ success: boolean }>('delete-lineup', {
      lineup_id: lineupId,
    })
  }

  async function toggleLike(lineupId: string): Promise<{ liked: boolean; count: number }> {
    return invokeFunction<{ liked: boolean; count: number }>('toggle-like', {
      lineup_id: lineupId,
    })
  }

  // Helper to convert File to base64
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  return {
    createLineup,
    updateLineup,
    deleteLineup,
    toggleLike,
    fileToBase64,
  }
}
