import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipBack, 
  SkipForward,
  Volume2,
  Maximize2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react'
import { useStore } from '../utils/store'

const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2]

// Text-to-Speech playback for demo
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

export default function Dictation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { materials, updateMaterialStatus, playbackSpeed, setPlaybackSpeed } = useStore()
  
  const material = materials.find(m => m.id === id)
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showOriginal, setShowOriginal] = useState(false)
  const [dictationText, setDictationText] = useState('')
  const ttsRef = useRef<TTSPlayer | null>(null)
  
  // A-B loop
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
const [_loopStart, setLoopStart] = useState<number | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
const [_loopEnd, setLoopEnd] = useState<number | null>(null)
  const [isLooping, setIsLooping] = useState(false)
  
  const progressRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    ttsRef.current = new TTSPlayer()
    return () => {
      ttsRef.current?.cancel()
    }
  }, [])
  
  useEffect(() => {
    if (material) {
      updateMaterialStatus(material.id, 'dictation')
      // Estimate duration based on transcript length (avg 150 words/min for English)
      const wordCount = material.transcript.split(/\s+/).length
      setDuration(Math.ceil(wordCount / 150 * 60))
    }
  }, [material?.id])
  
  const togglePlay = useCallback(() => {
    if (!ttsRef.current || !material) return
    
    if (isPlaying) {
      ttsRef.current.pause()
      setIsPlaying(false)
    } else {
      if (ttsRef.current.isPaused()) {
        ttsRef.current.resume()
      } else {
        // Split transcript into sentences and play
        const sentences = material.transcript.split(/(?<=[.!?])\s+/)
        let currentIndex = 0
        
        const playNext = () => {
          if (currentIndex < sentences.length && ttsRef.current) {
            setCurrentTime((currentIndex / sentences.length) * duration)
            ttsRef.current.speak(sentences[currentIndex], () => {
              currentIndex++
              if (currentIndex < sentences.length) {
                playNext()
              } else {
                setIsPlaying(false)
                setCurrentTime(duration)
              }
            })
          }
        }
        playNext()
      }
      setIsPlaying(true)
    }
  }, [isPlaying, material, duration])
  
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !material) return
    const rect = progressRef.current.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    const newTime = pos * duration
    setCurrentTime(newTime)
    
    // Resume playing from new position
    if (isPlaying && ttsRef.current) {
      ttsRef.current.cancel()
    }
  }
  
  const skipBackward = () => {
    setCurrentTime(Math.max(0, currentTime - 10))
  }
  
  const skipForward = () => {
    setCurrentTime(Math.min(duration, currentTime + 10))
  }
  
  const stopPlaying = () => {
    if (ttsRef.current) {
      ttsRef.current.cancel()
    }
    setIsPlaying(false)
  }
  
  const clearLoop = () => {
    setLoopStart(null)
    setLoopEnd(null)
    setIsLooping(false)
  }
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
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
  
  return (
    <div className="h-[calc(100vh-72px)] flex flex-col">
      {/* Header */}
      <div className="px-8 py-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              stopPlaying()
              navigate('/materials')
            }}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold">{material.titleEn}</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">{material.title}</p>
          </div>
          <span className="text-sm text-[var(--color-accent)] px-3 py-1 bg-[var(--color-accent)]/10 rounded-full">
            第一阶段：盲听听写
          </span>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Player Panel */}
        <div className="w-[400px] border-r border-[var(--color-border)] p-6 flex flex-col">
          {/* Album Art / Visualizer Placeholder */}
          <div className="aspect-square rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-transparent flex items-center justify-center mb-6 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center gap-1">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-amber-500/60 rounded-full"
                  animate={{
                    height: isPlaying ? [20, Math.random() * 60 + 20, 20] : 20
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.05
                  }}
                  style={{ height: 20 }}
                />
              ))}
            </div>
            <Volume2 className="w-16 h-16 text-amber-500/40" />
          </div>
          
          {/* Progress Bar */}
          <div 
            ref={progressRef}
            className="h-2 bg-[var(--color-bg-tertiary)] rounded-full cursor-pointer mb-2 relative group"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full relative"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          
          {/* Time Display */}
          <div className="flex justify-between text-sm text-[var(--color-text-secondary)] mb-6">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          
          {/* Player Controls */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <button 
              onClick={stopPlaying}
              className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button 
              onClick={skipBackward}
              className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button 
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-black" />
              ) : (
                <Play className="w-6 h-6 text-black ml-1" />
              )}
            </button>
            <button 
              onClick={skipForward}
              className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button 
              onClick={clearLoop}
              className={`p-2 rounded-lg ${isLooping ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'}`}
              title="清除循环"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
          
          {/* Speed Control */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-sm text-[var(--color-text-secondary)]">语速</span>
            {playbackSpeeds.map(speed => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  playbackSpeed === speed 
                    ? 'bg-amber-500 text-black' 
                    : 'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)]'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
          
          {/* Toggle Original */}
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          >
            {showOriginal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showOriginal ? '隐藏原文' : '显示原文'}
          </button>
          
          <p className="text-xs text-center text-[var(--color-text-secondary)] mt-4">
            使用浏览器 TTS 语音播放
          </p>
        </div>
        
        {/* Dictation Panel */}
        <div className="flex-1 p-6 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[var(--color-accent)]" />
              听写区
            </h2>
            <span className="text-sm text-[var(--color-text-secondary)]">
              建议：先盲听3遍再开始动笔
            </span>
          </div>
          
          {/* Dictation Input */}
          <textarea
            value={dictationText}
            onChange={(e) => setDictationText(e.target.value)}
            placeholder="在这里输入你听到的内容...

操作提示：
- 使用播放控制反复聆听
- 调节语速从慢到快
- 点击进度条跳转位置"
            className="dictation-input flex-1 resize-none"
          />
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-border)]">
            <div className="text-sm text-[var(--color-text-secondary)]">
              字数：{dictationText.trim().length}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setDictationText('')}
                className="btn btn-secondary"
              >
                清空
              </button>
              <button 
                onClick={() => navigate(`/understanding/${material.id}`)}
                className="btn btn-primary"
                disabled={dictationText.trim().length === 0}
              >
                进入下一阶段
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Original Text Panel */}
        <AnimatePresence>
          {showOriginal && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-[var(--color-border)] p-6 overflow-hidden"
            >
              <h2 className="font-semibold mb-4">原文</h2>
              <div className="text-sm leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-wrap">
                {material.transcript}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
