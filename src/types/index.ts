export interface Material {
  id: string
  title: string
  titleEn: string
  duration: number // in seconds
  category: 'news' | 'interview' | 'documentary' | 'speech' | 'ted'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  audioUrl: string
  transcript: string
  translation?: string
  createdAt: number
  status: 'pending' | 'dictation' | 'understanding' | 'recitation' | 'completed'
}

export interface DictationProgress {
  materialId: string
  content: string
  segments: DictationSegment[]
  completedAt?: number
}

export interface DictationSegment {
  id: number
  startTime: number
  endTime: number
  text: string
  userInput: string
  isCompleted: boolean
}

export interface Word {
  id: string
  word: string
  definition: string
  phonetic?: string
  materialId: string
  context?: string
  addedAt: number
}

export interface RecitationProgress {
  materialId: string
  segmentsStatus: { [segmentId: number]: 'pending' | 'practicing' | 'completed' }
  currentSpeed: number
  targetSpeed: number
  hintCount: number
  completedAt?: number
}

export interface StudyStats {
  totalTime: number
  materialsCompleted: number
  currentStreak: number
  lastStudyDate?: string
  wordsLearned: number
}
