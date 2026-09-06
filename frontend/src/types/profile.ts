import type { Topic } from './topic'

/** The player's onboarding selections and skill preferences. */
export interface PlayerProfile {
  id: number
  language: string
  framework: string
  seniority: string
  topics: Topic[]
}
