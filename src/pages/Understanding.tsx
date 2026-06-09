import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight,
  Languages,
  FileText,
  Lightbulb,
  Trash2,
  Plus,
  Play,
  Pause
} from 'lucide-react'
import { useStore } from '../utils/store'
import type { Word } from '../types'

// TTS player for Understanding page
class TTSPlayer {
  private utterance: SpeechSynthesisUtterance | null = null
  
  speak(text: string) {
    this.cancel()
    this.utterance = new SpeechSynthesisUtterance(text)
    this.utterance.lang = 'en-US'
    speechSynthesis.speak(this.utterance)
  }
  
  cancel() {
    speechSynthesis.cancel()
    this.utterance = null
  }
  
  isSpeaking() {
    return speechSynthesis.speaking
  }
}

export default function Understanding() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { materials, updateMaterialStatus, words, addWord, removeWord } = useStore()
  
  const material = materials.find(m => m.id === id)
  const ttsRef = useRef<TTSPlayer>(new TTSPlayer())
  
  const [activeTab, setActiveTab] = useState<'transcript' | 'vocabulary' | 'notes'>('transcript')
  const [showTranslation, setShowTranslation] = useState(true)
  const [selectedWord, setSelectedWord] = useState<{ word: string; context: string } | null>(null)
  const [notes, setNotes] = useState('')
  const [newWord, setNewWord] = useState({ word: '', definition: '', phonetic: '' })
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Listen to current sentence
  const [playingSentenceIndex, setPlayingSentenceIndex] = useState(-1)
  
  useEffect(() => {
    if (material) {
      updateMaterialStatus(material.id, 'understanding')
    }
    return () => {
      ttsRef.current.cancel()
    }
  }, [material?.id])
  
  const playSentence = (sentence: string, index: number) => {
    if (isPlaying && playingSentenceIndex === index) {
      ttsRef.current.cancel()
      setIsPlaying(false)
      setPlayingSentenceIndex(-1)
    } else {
      setPlayingSentenceIndex(index)
      setIsPlaying(true)
      ttsRef.current.speak(sentence)
      // When TTS ends, reset state
      const checkEnd = setInterval(() => {
        if (!ttsRef.current.isSpeaking()) {
          setIsPlaying(false)
          setPlayingSentenceIndex(-1)
          clearInterval(checkEnd)
        }
      }, 500)
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
  
  const sentences = material.transcript.split(/(?<=[.!?])\s+/)
  
    
  const handleAddWord = () => {
    if (!newWord.word || !newWord.definition) return
    
    const word: Word = {
      id: Date.now().toString(),
      word: newWord.word,
      definition: newWord.definition,
      phonetic: newWord.phonetic,
      materialId: material.id,
      context: selectedWord?.context,
      addedAt: Date.now()
    }
    
    addWord(word)
    setNewWord({ word: '', definition: '', phonetic: '' })
    setSelectedWord(null)
  }
  
  const materialWords = words.filter(w => w.materialId === material.id)
  
  return (
    <div className="h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] md:h-[calc(100vh-72px)]
                    flex flex-col">
      {/* Header */}
      <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-[var(--color-border)] flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => navigate(`/dictation/${material.id}`)} className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-sm sm:text-base truncate">{material.titleEn}</h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] truncate">{material.title}</p>
          </div>
          <span className="hidden md:inline-block text-sm text-emerald-400 px-3 py-1 bg-emerald-500/10 rounded-full whitespace-nowrap">
            第二阶段：深度理解
          </span>
          <button onClick={() => navigate(`/recitation/${material.id}`)} className="btn btn-primary text-sm whitespace-nowrap min-h-[44px]">
            <span className="hidden sm:inline">进入背诵</span>
            <span className="sm:hidden">背诵</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* 移动端阶段标签 */}
      <div className="md:hidden px-3 py-2 bg-emerald-500/10 border-b border-[var(--color-border)] flex-shrink-0">
        <span className="text-xs text-emerald-400 font-medium">第二阶段：深度理解</span>
      </div>

      {/* Tab Navigation — 移动端横向滚动 */}
      <div className="flex border-b border-[var(--color-border)] overflow-x-auto flex-shrink-0 scrollbar-hide">
        <button
          onClick={() => setActiveTab('transcript')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-3 border-b-2 transition-colors whitespace-nowrap min-h-[48px] ${
            activeTab === 'transcript'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          <FileText className="w-5 h-5" />
          原文研读
        </button>
        <button
          onClick={() => setActiveTab('vocabulary')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-3 border-b-2 transition-colors whitespace-nowrap min-h-[48px] ${
            activeTab === 'vocabulary'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          词汇本
          {materialWords.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-amber-500/20 rounded-full">
              {materialWords.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-3 border-b-2 transition-colors whitespace-nowrap min-h-[48px] ${
            activeTab === 'notes'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          <Lightbulb className="w-5 h-5" />
          学习笔记
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        <AnimatePresence mode="wait">
          {activeTab === 'transcript' && (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex"
            >
              {/* English Transcript */}
              <div className="flex-1 p-4 sm:p-6 overflow-auto border-b md:border-b-0 md:border-r border-[var(--color-border)] min-w-0">
                <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                  <h2 className="font-semibold text-sm sm:text-base">英文原文 (点击句子听读)</h2>
                  <button
                    onClick={() => setShowTranslation(!showTranslation)}
                    className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                  >
                    <Languages className="w-4 h-4" />
                    {showTranslation ? '隐藏' : '显示'}翻译
                  </button>
                </div>
                <div className="space-y-4">
                  {sentences.map((sentence, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="group p-3 rounded-lg hover:bg-[var(--color-bg-tertiary)] cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            playSentence(sentence, index)
                          }}
                          className={`mt-1 p-1 rounded-full ${playingSentenceIndex === index ? 'bg-amber-500 text-black' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-amber-500'}`}
                        >
                          {playingSentenceIndex === index ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <div className="flex-1">
                          <p className="leading-relaxed">{sentence}</p>
                          <p className="text-sm text-blue-400 opacity-0 group-hover:opacity-100 mt-1">
                            点击单词添加生词
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Chinese Translation */}
              <AnimatePresence>
                {showTranslation && material.translation && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="md:!w-[400px] md:!h-auto overflow-hidden bg-[var(--color-bg-secondary)]
                               border-t md:border-t-0 md:border-l border-[var(--color-border)] flex-shrink-0"
                  >
                    <div className="p-4 sm:p-6 overflow-auto max-h-[40vh] md:max-h-none">
                      <h2 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base text-[var(--color-text-secondary)]">中文翻译</h2>
                      <div className="space-y-3 sm:space-y-4 text-sm text-[var(--color-text-secondary)]">
                        {material.translation.split(/(?<=[.!?])\s+/).map((sentence, index) => (
                          <p key={index} className="leading-relaxed">{sentence}</p>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
          
          {activeTab === 'vocabulary' && (
            <motion.div
              key="vocabulary"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col md:flex-row overflow-hidden"
            >
              {/* Word List */}
              <div className="flex-1 p-4 sm:p-6 overflow-auto min-w-0">
                <h2 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">本篇词汇 ({materialWords.length})</h2>
                {materialWords.length === 0 ? (
                  <div className="text-center py-10 sm:py-12 text-[var(--color-text-secondary)]">
                    <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">点击原文中的单词添加到这里</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {materialWords.map(word => (
                      <div
                        key={word.id}
                        className="card flex items-start justify-between group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-base sm:text-lg">{word.word}</span>
                            {word.phonetic && (
                              <span className="text-sm text-[var(--color-text-secondary)]">
                                {word.phonetic}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[var(--color-text-secondary)]">{word.definition}</p>
                          {word.context && (
                            <p className="text-sm text-[var(--color-text-secondary)] mt-2 italic line-clamp-2">
                              "{word.context}"
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeWord(word.id)}
                          className="p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-red-400 hover:bg-red-500/10 rounded-lg transition-all min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0"
                          aria-label="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Word Panel */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-[var(--color-border)] p-4 sm:p-6 md:overflow-auto flex-shrink-0">
                <h3 className="font-semibold mb-4">添加单词</h3>
                {selectedWord ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-[var(--color-text-secondary)]">单词</label>
                      <input
                        type="text"
                        value={selectedWord.word}
                        readOnly
                        className="w-full mt-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-base"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[var(--color-text-secondary)]">音标</label>
                      <input
                        type="text"
                        value={newWord.phonetic}
                        onChange={(e) => setNewWord({...newWord, phonetic: e.target.value})}
                        placeholder="/eI/ 或 /kæt/"
                        className="w-full mt-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-base min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[var(--color-text-secondary)]">释义</label>
                      <textarea
                        value={newWord.definition}
                        onChange={(e) => setNewWord({...newWord, definition: e.target.value})}
                        placeholder="输入中文释义..."
                        className="w-full mt-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-base h-20 resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddWord}
                        className="btn btn-primary flex-1"
                        disabled={!newWord.definition}
                      >
                        <Plus className="w-4 h-4" />
                        添加
                      </button>
                      <button
                        onClick={() => setSelectedWord(null)}
                        className="btn btn-secondary"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--color-text-secondary)]">
                    <p>从原文点击单词开始添加</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          
          {activeTab === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 p-4 sm:p-6 overflow-auto"
            >
              <h2 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">学习笔记</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="记录你的学习心得、语法知识点、长难句分析..."
                className="dictation-input h-[calc(100%-60px)] text-base"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
