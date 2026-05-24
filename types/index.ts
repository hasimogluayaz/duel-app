export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Supabase Database type — matches what @supabase/ssr expects
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          total_points?: number
          weekly_points?: number
          streak_count?: number
          last_played_at?: string | null
          personality_type?: string | null
          personality_updated_at?: string | null
          created_at?: string
        }
        Update: {
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          total_points?: number
          weekly_points?: number
          streak_count?: number
          last_played_at?: string | null
          personality_type?: string | null
          personality_updated_at?: string | null
        }
      }
      scenarios: {
        Row: Scenario
        Insert: {
          id?: string
          content: string
          active_date: string
          generated_at?: string
        }
        Update: {
          content?: string
          active_date?: string
        }
      }
      answers: {
        Row: Answer
        Insert: {
          id?: string
          user_id: string
          scenario_id: string
          content: string
          created_at?: string
        }
        Update: {
          content?: string
        }
      }
      duels: {
        Row: Duel
        Insert: {
          id?: string
          scenario_id: string
          challenger_id: string
          challenged_id: string
          challenger_answer_id?: string | null
          challenged_answer_id?: string | null
          status?: DuelStatus
          winner_id?: string | null
          ai_verdict?: string | null
          ai_roast?: string | null
          vote_deadline?: string | null
          share_token: string
          created_at?: string
        }
        Update: {
          challenged_answer_id?: string | null
          status?: DuelStatus
          winner_id?: string | null
          ai_verdict?: string | null
          ai_roast?: string | null
          vote_deadline?: string | null
        }
      }
      votes: {
        Row: Vote
        Insert: {
          id?: string
          duel_id: string
          voter_id: string
          voted_for_id: string
          created_at?: string
        }
        Update: Record<string, never>
      }
      notifications: {
        Row: Notification
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: Json
          is_read?: boolean
          created_at?: string
        }
        Update: {
          is_read?: boolean
          title?: string
          message?: string
        }
      }
      achievements: {
        Row: Achievement
        Insert: {
          id?: string
          user_id: string
          type: AchievementType
          earned_at?: string
        }
        Update: Record<string, never>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  total_points: number
  weekly_points: number
  streak_count: number
  last_played_at: string | null
  personality_type: string | null
  personality_updated_at: string | null
  is_admin: boolean
  is_banned: boolean
  created_at: string
  streak_freeze_count?: number
}

export interface Scenario {
  id: string
  content: string
  active_date: string
  generated_at: string
}

export interface Answer {
  id: string
  user_id: string
  scenario_id: string
  content: string
  created_at: string
}

export type DuelStatus = 'pending' | 'active' | 'completed'

export interface Duel {
  id: string
  scenario_id: string
  challenger_id: string
  challenged_id: string
  challenger_answer_id: string | null
  challenged_answer_id: string | null
  status: DuelStatus
  winner_id: string | null
  ai_verdict: string | null
  ai_roast: string | null
  vote_deadline: string | null
  created_at: string
  share_token: string
}

export interface Vote {
  id: string
  duel_id: string
  voter_id: string
  voted_for_id: string
  created_at: string
}

export type NotificationType =
  | 'duel_invite'
  | 'duel_result'
  | 'duel_accepted'
  | 'vote_milestone'
  | 'streak_reminder'
  | 'streak_milestone'
  | 'new_follower'
  | 'vote_received'
  | 'new_comment'
  | 'comment_reply'
  | 'achievement'
  | 'weekly_mission_complete'
  | 'tier_up'
  | 'system'
  | 'answer_comment'
  | 'reaction_milestone'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data: Json
  is_read: boolean
  created_at: string
}

export type AchievementType =
  | 'first_win'
  | 'streak_7'
  | 'streak_30'
  | 'roast_master'
  | 'popular'

export interface Achievement {
  id: string
  user_id: string
  type: AchievementType
  earned_at: string
}

// Extended types with joined data
export interface DuelWithDetails extends Duel {
  scenario?: Scenario
  challenger?: Profile
  challenged?: Profile
  challenger_answer?: Answer
  challenged_answer?: Answer
  vote_count_challenger?: number
  vote_count_challenged?: number
  user_vote?: string | null
}

export interface ProfileWithStats extends Profile {
  win_count: number
  duel_count: number
  win_rate: number
  achievements: Achievement[]
}

// API response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface LeaderboardEntry {
  rank: number
  profile: Profile
  win_count: number
  duel_count: number
  win_rate: number
}

export type LeaderboardPeriod = 'weekly' | 'all_time'

// AI types
export interface AIScenarioResponse {
  scenario: string
}

export interface AIVerdictResponse {
  winner: 'A' | 'B'
  verdict: string
  roast: string
}

export interface AIPersonalityResponse {
  personality_type: string
  description: string
}

// Form types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  password: string
  username: string
  display_name: string
}

export interface ProfileUpdateForm {
  display_name: string
  bio: string
  avatar_url: string
}

// Direct messaging
export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
}

export interface Conversation {
  user: Profile
  last_message: Message
  unread_count: number
  pending_duel?: string | null
}

// Points config
export const POINTS = {
  DUEL_WIN: 50,
  DUEL_LOSE: 10,
  VOTE_RECEIVED: 2,
  VOTE_CAST: 1,        // oy kullanan kullanıcı da puan kazanır
  DAILY_ANSWER: 5,
  STREAK_7: 100,
  STREAK_30: 500,
  REFERRAL: 100,       // davet eden kullanıcı için
} as const

// Achievement labels
export const ACHIEVEMENT_LABELS: Record<AchievementType, { label: string; emoji: string; description: string }> = {
  first_win: { label: 'İlk Zafer', emoji: '🏆', description: 'İlk düellonu kazandın' },
  streak_7: { label: '7 Gün Serisi', emoji: '🔥', description: '7 gün üst üste oynadın' },
  streak_30: { label: 'Aylık Şampiyon', emoji: '👑', description: '30 gün üst üste oynadın' },
  roast_master: { label: 'Roast Ustası', emoji: '🎤', description: '10 düello kazandın' },
  popular: { label: 'Popüler', emoji: '⭐', description: '100 oy aldın' },
} as const
