import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  CheckCircle2,
  Circle,
  Volume2,
  Target,
  Clock,
  Trophy
} from 'lucide-react'
import { useStore } from '../utils/store'

type SegmentStatus = 'pending' | 'practicing' | 'completed'

interface Segment {
  id: number
  text: string
  startTime: number
  endTime: number
  status: SegmentStatus
}

class TTSPlayer {
  private utterance: SpeechSynthesisUtterance | null = null
  private onEndCallback: (() => void) | null = null
  
  speak(text: string, onEnd?: () => void) {
    this.cancel()
    this.utterance = new SpeechSynthesisUtterance(text)
    this.utterance.rate = 1
    this.utterance.lang = 'en-US'
    this.onEndCallback = onEnd || null
    this.utterance.onend = () => {
      if (this.onEndCallback) this.onEndCallback()
    }
    speechSynthesis.speak(this.utterance)
  }
  
  pause() {
    speechSynthesis.pause()
  }
  
  resume() {
    speechSynthesis.resume()
  }
  
  cancel() {
    speechSynthesis.cancel()
    this.utterance = null
  }
  
  isSpeaking() {
    return speechSynthesis.speaking
  }
  
  isPaused() {
    return speechSynthesis.paused
  }
}

export default function Recitation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { materials, updateMaterialStatus, updateStats } = useStore()
  
  const material = materials.find(m => m.id === id)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSegmentId, setCurrentSegmentId] = useState(0)
  const [showText, setShowText] = useState(true)
  const [hintCount, setHintCount] = useState(0)
  const [practiceMode, setPracticeMode] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [segmentCompletion, setSegmentCompletion] = useState<Set<number>>(new Set())
  
  const ttsRef = useRef<TTSPlayer | null>(null)
  
  // Split transcript into segments
  const segments: Segment[] = material?.transcript
    .split("\n\n")
    .filter(s => s.trim())
    .map((text, index) => ({
      id: index,
      text: text.trim(),
      startTime: 0,
      endTime: 0,
      status: segmentCompletion.has(index) ? 'completed' as SegmentStatus : 'pending' as SegmentStatus
    })) || []
  
  useEffect(() => {
    ttsRef.current = new TTSPlayer()
    return () => {
      ttsRef.current?.cancel()
    }
  }, [])
  
  useEffect(() => {
    if (material) {
      updateMaterialStatus(material.id, 'recitation')
      setStartTime(Date.now())
    }
  }, [material?.id])
  
  const playCurrentSegment = useCallback(() => {
    if (!ttsRef.current || !segments[currentSegmentId]) return
    
    const text = segments[currentSegmentId].text
    ttsRef.current.speak(text, () => {
      setIsPlaying(false)
    })
    setIsPlaying(true)
  }, [currentSegmentId, segments])
  
  const togglePlay = useCallback(() => {
    if (!ttsRef.current || !material) return
    
    if (isPlaying) {
      ttsRef.current.pause()
      setIsPlaying(false)
    } else {
      if (ttsRef.current.isPaused()) {
        ttsRef.current.resume()
        setIsPlaying(true)
      } else {
        playCurrentSegment()
      }
    }
  }, [isPlaying, playCurrentSegment, material])
  
  const handleSegmentComplete = () => {
    setSegmentCompletion(prev => new Set([...prev, currentSegmentId]))
    if (currentSegmentId < segments.length - 1) {
      setCurrentSegmentId(currentSegmentId + 1)
    }
    setPracticeMode(false)
  }
  
  const useHint = () => {
    if (hintCount < 3) {
      setHintCount(hintCount + 1)
      playCurrentSegment()
    }
  }
  
  const handleFinish = () => {
    if (material) {
      updateMaterialStatus(material.id, 'completed')
      updateStats({
        materialsCompleted: 1,
        totalTime: startTime ? Math.floor((Date.now() - startTime) / 60000) : 0
      })
      navigate('/')
    }
  }
  
  if (!material) {
    return (
      <div className="p-8 text-center">
        <p className="text-[var(--color-text-secondary)]">素材不存在</p>
        <button onClick={() => navigate('/materials')} className="btn btn-secondary mt-4">
          返回素材库
        </button>
      </div>
    )
  }
  
  const completedCount = segmentCompletion.size
  const progress = segments.length > 0 ? (completedCount / segments.length) * 100 : 0
  
  return (
    <div className="h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] md:h-[calc(100vh-72px)]
                    flex flex-col">
      <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-[var(--color-border)] flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => {
              ttsRef.current?.cancel()
              navigate(`/understanding/${material.id}`)
            }}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors
                       min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-sm sm:text-base truncate">{material.titleEn}</h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] truncate">{material.title}</p>
          </div>
          <span className="hidden md:inline-block text-sm text-purple-400 px-3 py-1 bg-purple-500/10 rounded-full whitespace-nowrap">
            第三阶段：极限背诵
          </span>
          <button onClick={handleFinish} className="btn btn-primary text-sm whitespace-nowrap min-h-[44px]">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">完成学习</span>
            <span className="sm:hidden">完成</span>
          </button>
        </div>
      </div>

      {/* 移动端阶段标签 */}
      <div className="md:hidden px-3 py-2 bg-purple-500/10 border-b border-[var(--color-border)] flex-shrink-0">
        <span className="text-xs text-purple-400 font-medium">第三阶段：极限背诵</span>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col md:max-w-3xl md:mx-auto w-full overflow-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--color-text-secondary)]">整体进度</span>
              <span className="text-sm font-medium">{completedCount} / {segments.length} 段落</span>
            </div>
            <div className="progress-bar">
              <motion.div 
                className="progress-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSegmentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center mb-6 sm:mb-8 px-2"
              >
                <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                  段落 {currentSegmentId + 1} / {segments.length}
                </p>
                {showText ? (
                  <p className="text-lg sm:text-2xl leading-relaxed max-w-2xl">{segments[currentSegmentId]?.text}</p>
                ) : (
                  <div className="w-48 sm:w-64 h-14 sm:h-16 bg-[var(--color-bg-tertiary)] rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-[var(--color-text-secondary)] text-sm sm:text-base">请背诵...</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
              <button
                onClick={() => setShowText(!showText)}
                className="btn btn-secondary text-sm min-h-[44px]"
              >
                {showText ? '隐藏原文' : '显示原文'}
              </button>

              <button
                onClick={togglePlay}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-500 hover:bg-amber-400
                           flex items-center justify-center transition-colors"
              >
                {isPlaying ? <Pause className="w-7 h-7 sm:w-8 sm:h-8 text-black" /> : <Play className="w-7 h-7 sm:w-8 sm:h-8 text-black ml-0.5 sm:ml-1" />}
              </button>

              <button
                onClick={useHint}
                disabled={hintCount >= 3}
                className="btn btn-secondary text-sm min-h-[44px]"
              >
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                提示 ({3 - hintCount})
              </button>
            </div>

            <div className="mt-6 sm:mt-8 flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
              <button
                onClick={() => setPracticeMode(!practiceMode)}
                className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors min-h-[44px] ${practiceMode ? 'bg-purple-500 text-white' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'}`}
              >
                {practiceMode ? '练习中...' : '开始练习'}
              </button>

              <AnimatePresence>
                {practiceMode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <button
                      onClick={handleSegmentComplete}
                      className="btn btn-primary text-sm min-h-[44px]"
                    >
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      标记完成
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm flex-wrap text-center">
            <Target className="w-4 h-4 text-[var(--color-text-secondary)]" />
            <span className="text-[var(--color-text-secondary)]">目标语速:</span>
            <span className="text-[var(--color-accent)] font-medium">
              {Math.floor(material.duration / 60)}:{String(Math.floor(material.duration % 60)).padStart(2, '0')} (原文语速)
            </span>
          </div>
        </div>

        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-[var(--color-border)] p-4 md:overflow-auto flex-shrink-0 max-h-[40vh] md:max-h-none">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            段落列表
          </h3>
          <div className="space-y-2">
            {segments.map((segment, index) => (
              <button
                key={segment.id}
                onClick={() => {
                  setCurrentSegmentId(index)
                  ttsRef.current?.cancel()
                  setIsPlaying(false)
                }}
                className={`w-full p-3 rounded-lg text-left flex items-center gap-3 transition-colors ${
                  currentSegmentId === index 
                    ? 'bg-amber-500/20 border border-amber-500/50' 
                    : 'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)]'
                }`}
              >
                {segmentCompletion.has(index) ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : currentSegmentId === index ? (
                  <Circle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-[var(--color-text-secondary)] flex-shrink-0" />
                )}
                <span className="text-sm line-clamp-2">{segment.text.substring(0, 50)}...</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
