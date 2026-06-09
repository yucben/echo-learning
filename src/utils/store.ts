import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Material, DictationProgress, Word, RecitationProgress, StudyStats } from '../types'
import { deleteAudioFile, parseAudioUrl } from './fileStorage'
import { BE01_TRANSCRIPT, BE01_TRANSLATION } from '../data/sample-materials/business-english-01'

interface AppState {
  // Materials
  materials: Material[]
  addMaterial: (material: Material) => void
  updateMaterialStatus: (id: string, status: Material['status']) => void
  removeMaterial: (id: string) => Promise<void>
  
  // Dictation
  dictationProgress: DictationProgress | null
  setDictationProgress: (progress: DictationProgress | null) => void
  saveDictationContent: (content: string) => void
  
  // Words (vocabulary)
  words: Word[]
  addWord: (word: Word) => void
  removeWord: (id: string) => void
  
  // Recitation
  recitationProgress: RecitationProgress | null
  setRecitationProgress: (progress: RecitationProgress | null) => void
  
  // Stats
  stats: StudyStats
  updateStats: (updates: Partial<StudyStats>) => void
  
  // Playback speed
  playbackSpeed: number
  setPlaybackSpeed: (speed: number) => void
}

// Sample materials for demo
const sampleMaterials: Material[] = [
  {
    id: '1',
    title: 'SpaceX Starship Launch',
    titleEn: 'SpaceX Starship 发射报道',
    duration: 1200, // 20 minutes
    category: 'news',
    difficulty: 'intermediate',
    audioUrl: '/samples/spacex-launch.mp3',
    transcript: `Today, SpaceX conducted a historic launch of its Starship rocket from Boca Chica, Texas. The mission, which had been delayed multiple times due to weather conditions, finally got underway at 8:02 AM local time.

The Starship, standing at approximately 120 meters tall, is the largest and most powerful rocket ever built. It consists of two stages: the Super Heavy booster and the upper stage Starship spacecraft.

During the flight, the Super Heavy booster successfully separated from the upper stage at around 3 minutes into the flight. The booster then executed a controlled descent back toward the launch site, where it was caught by the Mechazilla arms - a first in aerospace history.

The upper stage continued its ascent, reaching orbital velocity before performing a controlled re-entry into Earth's atmosphere. It successfully splashed down in the Indian Ocean, marking a major milestone in SpaceX's quest for fully reusable rockets.

Elon Musk, SpaceX's CEO, described the launch as "a giant leap toward making life multiplanetary." He emphasized that the success of this mission brings humanity closer to establishing permanent bases on Mars.

This launch represents years of development and countless hours of work by thousands of engineers at SpaceX. The company plans to use Starship for various missions, including lunar landings as part of NASA's Artemis program and eventually crewed missions to Mars.`,
    translation: `今天，SpaceX在德克萨斯州博卡奇卡进行了历史性的Starship火箭发射。由于天气条件多次推迟后，任务终于在当地时间的上午8:02开始。

Starship高约120米，是有史以来最大、最强大的火箭。它由两级组成：Super Heavy助推器和上级Starship飞船。

在飞行过程中，Super Heavy助推器在升空约3分钟后成功与上级分离。助推器随后执行受控下降，返回发射站，被Mechazilla机械臂捕获——这是航空史上的首次。

上级飞船继续上升，达到轨道速度后执行受控再入大气层。它成功在印度洋溅落，标志着SpaceX追求完全可重复使用火箭的重大里程碑。

SpaceX首席执行官埃隆·马斯克称这次发射是"实现多星球生活的巨大飞跃"。他强调，这次任务的成功使人类更接近在火星上建立永久基地。

此次发射代表了SpaceX数千名工程师多年的开发和无数小时的工作。该公司计划使用Starship执行各种任务，包括作为NASA阿尔忒弥斯计划一部分的月球登陆，以及最终的火星载人任务。`,
    createdAt: Date.now(),
    status: 'pending'
  },
  {
    id: '2',
    title: 'Climate Change Interview',
    titleEn: '气候变化专访',
    duration: 900, // 15 minutes  
    category: 'interview',
    difficulty: 'advanced',
    audioUrl: '/samples/climate-interview.mp3',
    transcript: `Today we're joined by Dr. Sarah Chen, a leading climate scientist at MIT, to discuss the latest findings on climate change and what they mean for our future.

Host: Dr. Chen, thank you for joining us. Let's start with the most recent data. What are we seeing in terms of global temperatures?

Dr. Chen: Thank you for having me. The data is quite concerning. We've just recorded the hottest month in recorded history, with global average temperatures reaching 1.5 degrees Celsius above pre-industrial levels. This is not just a statistic - it represents real impacts on ecosystems, weather patterns, and human societies around the world.

Host: What are the immediate effects we're already experiencing?

Dr. Chen: We're seeing more frequent and intense extreme weather events - hurricanes, droughts, floods, and heatwaves. Coral reef bleaching is accelerating across the Pacific. Ice caps are melting faster than predicted. And we're observing shifts in migration patterns for many species.

Host: There's been a lot of debate about solutions. What do you see as the most promising approaches?

Dr. Chen: We need immediate action on multiple fronts. First, transitioning to renewable energy sources is no longer optional - it's essential. Second, we need to invest heavily in carbon capture technologies. Third, adaptation strategies must be developed, especially for vulnerable communities in coastal regions and developing nations.

Host: Is there still hope? 

Dr. Chen: Absolutely. The technology exists to address this crisis. What we need is the collective will to implement it. Young people around the world are demanding action, and I believe we can rise to meet this challenge.`,
    translation: `今天我们邀请到了MIT的顶尖气候科学家陈Sarah博士，讨论气候变化的最新发现及其对我们未来的意义。

主持人：陈博士，感谢接受我们的采访。让我从最新的数据开始。全球气温方面我们看到了什么？

陈博士：谢谢邀请。数据相当令人担忧。我们刚刚记录了有史以来最热的月份，全球平均气温比工业化前水平高出1.5度。这不仅仅是一个统计数字——它代表着对全世界生态系统、天气模式和社会人类的真实影响。

主持人：我们正在经历哪些直接影响？

陈博士：我们看到更频繁和更强烈的极端天气事件——飓风、干旱、洪水和热浪。太平洋地区的珊瑚礁白化正在加速。冰盖融化速度比预测的要快。我们还观察到许多物种的迁徙模式正在发生变化。

主持人：关于解决方案有很多讨论。你认为最有希望的方法是什么？

陈博士：我们需要在多个方面立即采取行动。首先，转向可再生能源不再是可选的——它是必须的。第二，我们需要大力投资碳捕获技术。第三，必须制定适应策略，特别是针对沿海地区和发展中国家的脆弱社区。

主持人：还有希望吗？

陈博士：当然有。解决这场危机的技术已经有了。我们需要的是实施它的集体意志。全世界年轻人都在要求采取行动，我相信我们可以迎接这一挑战。`,
    createdAt: Date.now() - 86400000,
    status: 'pending'
  },
  {
    id: 'be-01',
    title: 'How to Explain a Project You Worked On',
    titleEn: '商务英语 p01 - 如何用英语介绍项目经历',
    duration: 2252, // 37:32 — B站 BV14rd3BJExq p01
    category: 'interview',
    difficulty: 'intermediate',
    audioUrl: '/samples/business-english-01.m4a',
    transcript: BE01_TRANSCRIPT,
    translation: BE01_TRANSLATION,
    sourceUrl: 'https://www.bilibili.com/video/BV14rd3BJExq?p=1',
    videoId: 'BV14rd3BJExq',
    createdAt: Date.now() - 172800000,
    status: 'pending'
  }
]

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Materials
      // 启动时合并：在 localStorage 中保留用户上传/状态变更的素材，
      // 同时补齐 sampleMaterials 中新增的示例素材（按 id 去重）
      materials: (() => {
        try {
          const raw = localStorage.getItem('echo-learning-storage')
          if (raw) {
            const persisted = JSON.parse(raw)
            const persistedMaterials: Material[] = persisted?.state?.materials ?? []
            const persistedIds = new Set(persistedMaterials.map(m => m.id))
            const newSamples = sampleMaterials.filter(m => !persistedIds.has(m.id))
            if (newSamples.length > 0) {
              return [...persistedMaterials, ...newSamples]
            }
            return persistedMaterials
          }
        } catch {
          // localStorage 读取失败（隐私模式/损坏），退回种子
        }
        return sampleMaterials
      })(),
      addMaterial: (material) => set((state) => ({ 
        materials: [...state.materials, material] 
      })),
      updateMaterialStatus: (id, status) => set((state) => ({
        materials: state.materials.map(m =>
          m.id === id ? { ...m, status } : m
        )
      })),
      removeMaterial: async (id) => {
        const target = get().materials.find(m => m.id === id)
        if (target) {
          // 同步清理 IndexedDB 中的音频文件
          const parsed = parseAudioUrl(target.audioUrl)
          if (parsed.type === 'idb' && parsed.id) {
            await deleteAudioFile(parsed.id)
          }
        }
        set((state) => ({
          materials: state.materials.filter(m => m.id !== id)
        }))
      },
      
      // Dictation
      dictationProgress: null,
      setDictationProgress: (progress) => set({ dictationProgress: progress }),
      saveDictationContent: (content) => {
        const progress = get().dictationProgress
        if (progress) {
          set({ dictationProgress: { ...progress, content } })
        }
      },
      
      // Words
      words: [],
      addWord: (word) => set((state) => ({ 
        words: [...state.words, word] 
      })),
      removeWord: (id) => set((state) => ({ 
        words: state.words.filter(w => w.id !== id) 
      })),
      
      // Recitation
      recitationProgress: null,
      setRecitationProgress: (progress) => set({ recitationProgress: progress }),
      
      // Stats
      stats: {
        totalTime: 0,
        materialsCompleted: 0,
        currentStreak: 0,
        wordsLearned: 0
      },
      updateStats: (updates) => set((state) => ({
        stats: { ...state.stats, ...updates }
      })),
      
      // Playback
      playbackSpeed: 1,
      setPlaybackSpeed: (speed) => set({ playbackSpeed: speed })
    }),
    {
      name: 'echo-learning-storage',
    }
  )
)
