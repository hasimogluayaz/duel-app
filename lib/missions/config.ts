export interface MissionConfig {
  type: string
  title: string
  description: string
  goal: number
  points: number
  icon: string
}

export const MISSIONS: MissionConfig[] = [
  { type: 'answer_scenario', title: 'Cevapçı', description: 'Herhangi bir senaryoya cevap ver', goal: 1, points: 20, icon: '💬' },
  { type: 'vote_3', title: 'Yargıç', description: '3 cevabı oylandir', goal: 3, points: 15, icon: '⚖️' },
  { type: 'challenge_duel', title: 'Meydan Okuyucu', description: 'Birini düelloya davet et', goal: 1, points: 25, icon: '⚔️' },
  { type: 'create_scenario', title: 'Yaratıcı', description: 'Kendi senaryonu oluştur', goal: 1, points: 30, icon: '✍️' },
  { type: 'follow_user', title: 'Sosyal', description: 'Birini takip et', goal: 1, points: 10, icon: '👥' },
]
