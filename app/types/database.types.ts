export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lineups: {
        Row: {
          id: string
          title: string
          description: string | null
          agent_uuid: string
          map_uuid: string
          user_id: string
          ability: string | null
          side: 'attack' | 'defense' | null
          site: string | null
          is_published: boolean
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          agent_uuid: string
          map_uuid: string
          user_id: string
          ability?: string | null
          side?: 'attack' | 'defense' | null
          site?: string | null
          is_published?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          agent_uuid?: string
          map_uuid?: string
          user_id?: string
          ability?: string | null
          side?: 'attack' | 'defense' | null
          site?: string | null
          is_published?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      lineup_media: {
        Row: {
          id: string
          lineup_id: string
          media_type: 'image' | 'video'
          url: string
          description: string | null
          sort_order: number
          is_cover: boolean
          created_at: string
        }
        Insert: {
          id?: string
          lineup_id: string
          media_type: 'image' | 'video'
          url: string
          description?: string | null
          sort_order?: number
          is_cover?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          lineup_id?: string
          media_type?: 'image' | 'video'
          url?: string
          description?: string | null
          sort_order?: number
          is_cover?: boolean
          created_at?: string
        }
      }
      lineup_likes: {
        Row: {
          id: string
          lineup_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          lineup_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          lineup_id?: string
          user_id?: string
          created_at?: string
        }
      }
      lineup_bookmarks: {
        Row: {
          id: string
          lineup_id: string
          user_id: string
          folder_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lineup_id: string
          user_id: string
          folder_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lineup_id?: string
          user_id?: string
          folder_id?: string | null
          created_at?: string
        }
      }
      bookmark_folders: {
        Row: {
          id: string
          user_id: string
          title: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          cover_url: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          cover_url?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          cover_url?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      collection_lineups: {
        Row: {
          id: string
          collection_id: string
          lineup_id: string
          sort_order: number
          added_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          lineup_id: string
          sort_order?: number
          added_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          lineup_id?: string
          sort_order?: number
          added_at?: string
        }
      }
      collection_subscriptions: {
        Row: {
          id: string
          collection_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          user_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// 便捷类型
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Lineup = Database['public']['Tables']['lineups']['Row']
export type LineupMedia = Database['public']['Tables']['lineup_media']['Row']
export type LineupLike = Database['public']['Tables']['lineup_likes']['Row']
export type LineupBookmark = Database['public']['Tables']['lineup_bookmarks']['Row']

// 带关联数据的类型 (从 Supabase 查询)
export type LineupWithRelations = Lineup & {
  profile: Profile
  media: LineupMedia[]
  likes_count: number
  bookmarks_count: number
}

export type Collection = Database['public']['Tables']['collections']['Row']
export type CollectionLineup = Database['public']['Tables']['collection_lineups']['Row']

export type CollectionWithRelations = Collection & {
  profile: Profile
  lineups_count: number
  subscribers_count: number
}

export type BookmarkFolder = Database['public']['Tables']['bookmark_folders']['Row']

export type BookmarkFolderWithCount = BookmarkFolder & {
  lineups_count: number
}
