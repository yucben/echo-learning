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
    <div className="h-[calc(100vh-72px)] flex flex-col">
      <div className="px-8 py-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              ttsRef.current?.cancel()
              navigate(`/understanding/${material.id}`)
            }} 
            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold">{material.titleEn}</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">{material.title}</p>
          </div>
          <span className="text-sm text-purple-400 px-3 py-1 bg-purple-500/10 rounded-full">
            第三阶段：极限背诵
          </span>
          <button onClick={handleFinish} className="btn btn-primary">
            <Trophy className="w-5 h-5" />完成学习
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-8 flex flex-col max-w-3xl mx-auto">
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
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSegmentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center mb-8"
              >
                <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                  段落 {currentSegmentId + 1} / {segments.length}
                </p>
                {showText ? (
                  <p className="text-2xl leading-relaxed max-w-2xl">{segments[currentSegmentId]?.text}</p>
                ) : (
                  <div className="w-64 h-16 bg-[var(--color-bg-tertiary)] rounded-lg flex items-center justify-center">
                    <span className="text-[var(--color-text-secondary)]">请背诵...</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowText(!showText)}
                className="btn btn-secondary"
              >
                {showText ? '隐藏原文' : '显示原文'}
              </button>
              
              <button 
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 flex items-center justify-center transition-colors"
              >
                {isPlaying ? <Pause className="w-8 h-8 text-black" /> : <Play className="w-8 h-8 text-black ml-1" />}
              </button>
              
              <button 
                onClick={useHint}
                disabled={hintCount >= 3}
                className="btn btn-secondary"
              >
                <Volume2 className="w-5 h-5" />
                提示 ({3 - hintCount})
              </button>
            </div>
            
            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={() => setPracticeMode(!practiceMode)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${practiceMode ? 'bg-purple-500 text-white' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'}`}
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
                      className="btn btn-primary"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      标记完成
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-center gap-4 text-sm">
            <Target className="w-4 h-4 text-[var(--color-text-secondary)]" />
            <span className="text-[var(--color-text-secondary)]">目标语速:</span>
            <span className="text-[var(--color-accent)] font-medium">
              {Math.floor(material.duration / 60)}:{String(Math.floor(material.duration % 60)).padStart(2, '0')} (原文语速)
            </span>
          </div>
        </div>
        
        <div className="w-80 border-l border-[var(--color-border)] p-4 overflow-auto">
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
