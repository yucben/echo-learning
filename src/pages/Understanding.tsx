import { useState, useEffect } from 'react'
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
  Plus
} from 'lucide-react'
import { useStore } from '../utils/store'
import type { Word } from '../types'

export default function Understanding() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { materials, updateMaterialStatus, words, addWord, removeWord } = useStore()
  
  const material = materials.find(m => m.id === id)
  
  const [activeTab, setActiveTab] = useState<'transcript' | 'vocabulary' | 'notes'>('transcript')
  const [showTranslation, setShowTranslation] = useState(true)
  const [selectedWord, setSelectedWord] = useState<{ word: string; context: string } | null>(null)
  const [notes, setNotes] = useState('')
  const [newWord, setNewWord] = useState({ word: '', definition: '', phonetic: '' })
  
  useEffect(() => {
    if (material) {
      updateMaterialStatus(material.id, 'understanding')
    }
  }, [material?.id])
  
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
  
  const handleWordClick = (sentence: string) => {
    const words = sentence.split(/\s+/).filter(w => w.length > 3)
    if (words.length > 0) {
      const randomWord = words[Math.floor(Math.random() * words.length)]
      setSelectedWord({ word: randomWord.replace(/[^a-zA-Z]/g, ''), context: sentence })
    }
  }
  
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
    <div className="h-[calc(100vh-72px)] flex flex-col">
      {/* Header */}
      <div className="px-8 py-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/dictation/${material.id}`)} className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold">{material.titleEn}</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">{material.title}</p>
          </div>
          <span className="text-sm text-emerald-400 px-3 py-1 bg-emerald-500/10 rounded-full">
            第二阶段：深度理解
          </span>
          <button onClick={() => navigate(`/recitation/${material.id}`)} className="btn btn-primary">
            进入背诵
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-[var(--color-border)]">
        <button
          onClick={() => setActiveTab('transcript')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
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
          className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
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
          className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
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
              <div className="flex-1 p-6 overflow-auto border-r border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">英文原文</h2>
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
                      onClick={() => handleWordClick(sentence)}
                    >
                      <p className="leading-relaxed">{sentence}</p>
                      <p className="text-sm text-blue-400 opacity-0 group-hover:opacity-100 mt-1">
                        点击添加生词
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Chinese Translation */}
              <AnimatePresence>
                {showTranslation && material.translation && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 400, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="p-6 overflow-auto bg-[var(--color-bg-secondary)]"
                  >
                    <h2 className="font-semibold mb-4 text-[var(--color-text-secondary)]">中文翻译</h2>
                    <div className="space-y-4 text-[var(--color-text-secondary)]">
                      {material.translation.split(/(?<=[.!?])\s+/).map((sentence, index) => (
                        <p key={index} className="leading-relaxed">{sentence}</p>
                      ))}
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
              className="flex-1 flex"
            >
              {/* Word List */}
              <div className="flex-1 p-6 overflow-auto">
                <h2 className="font-semibold mb-4">本篇词汇 ({materialWords.length})</h2>
                {materialWords.length === 0 ? (
                  <div className="text-center py-12 text-[var(--color-text-secondary)]">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>点击原文中的单词添加到这里</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {materialWords.map(word => (
                      <div 
                        key={word.id}
                        className="card flex items-start justify-between group"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-lg">{word.word}</span>
                            {word.phonetic && (
                              <span className="text-sm text-[var(--color-text-secondary)]">
                                {word.phonetic}
                              </span>
                            )}
                          </div>
                          <p className="text-[var(--color-text-secondary)]">{word.definition}</p>
                          {word.context && (
                            <p className="text-sm text-[var(--color-text-secondary)] mt-2 italic">
                              "{word.context}"
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeWord(word.id)}
                          className="p-2 opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Add Word Panel */}
              <div className="w-80 border-l border-[var(--color-border)] p-6">
                <h3 className="font-semibold mb-4">添加单词</h3>
                {selectedWord ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-[var(--color-text-secondary)]">单词</label>
                      <input
                        type="text"
                        value={selectedWord.word}
                        readOnly
                        className="w-full mt-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[var(--color-text-secondary)]">音标</label>
                      <input
                        type="text"
                        value={newWord.phonetic}
                        onChange={(e) => setNewWord({ ...newWord, phonetic: e.target.value })}
                        placeholder="/eI/ 或 /kæt/"
                        className="w-full mt-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[var(--color-text-secondary)]">释义</label>
                      <textarea
                        value={newWord.definition}
                        onChange={(e) => setNewWord({ ...newWord, definition: e.target.value })}
                        placeholder="输入中文释义..."
                        className="w-full mt-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-3 py-2 h-20 resize-none"
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
              className="flex-1 p-6 overflow-auto"
            >
              <h2 className="font-semibold mb-4">学习笔记</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="记录你的学习心得、语法知识点、长难句分析..."
                className="dictation-input h-[calc(100%-60px)]"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
