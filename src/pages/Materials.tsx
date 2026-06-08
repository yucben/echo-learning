import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Upload, 
  Clock, 
  Play,
  ChevronRight,
  Tag,
  BarChart3,
  Sparkles,
  X,
  FileAudio,
  CheckCircle,
  Link,
  Loader2
} from 'lucide-react'
import { useStore } from '../utils/store'
import type { Material } from '../types'

const categoryLabels = {
  news: '新闻',
  interview: '访谈',
  documentary: '纪录片',
  speech: '演讲',
  ted: 'TED演讲'
}

const difficultyLabels = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级'
}

const difficultyColors = {
  beginner: 'bg-emerald-500/20 text-emerald-400',
  intermediate: 'bg-amber-500/20 text-amber-400',
  advanced: 'bg-red-500/20 text-red-400'
}

export default function Materials() {
  const navigate = useNavigate()
  const { materials, addMaterial } = useStore()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Material['category'] | 'all'>('all')
  const [difficulty, setDifficulty] = useState<Material['difficulty'] | 'all'>('all')
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadData, setUploadData] = useState<Record<string, any>>({
    title: '',
    titleEn: '',
    category: 'news' as Material['category'],
    difficulty: 'intermediate' as Material['difficulty'],
    transcript: '',
    translation: '',
    sourceUrl: '',
    videoId: '',
    coverUrl: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // B站 import state
  const [uploadMode, setUploadMode] = useState<'file' | 'bilibili'>('bilibili')
  const [bilibiliUrl, setBilibiliUrl] = useState('')
  const [bilibiliLoading, setBilibiliLoading] = useState(false)
  const [bilibiliError, setBilibiliError] = useState('')
  const [bilibiliPreview, setBilibiliPreview] = useState<any>(null)
  
  const handleBilibiliImport = async () => {
    if (!bilibiliUrl.trim()) return
    setBilibiliLoading(true)
    setBilibiliError('')
    
    try {
      // Parse B站 URL
      let bvid = ''
      const bvMatch = bilibiliUrl.match(/BV[a-zA-Z0-9]{10}/)
      if (bvMatch) {
        bvid = bvMatch[0]
      } else {
        // Try to resolve short link
        setBilibiliError('请输入有效的B站视频链接 (BV号)')
        setBilibiliLoading(false)
        return
      }
      
      // Fetch video info from B站 API
      // B站 API 有 CORS 限制，通过代理请求
      const bilibiliApiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`
      const corsProxy = 'https://corsproxy.io/?'
      const resp = await fetch(corsProxy + encodeURIComponent(bilibiliApiUrl))
      const data = await resp.json()
      
      if (data.code !== 0) {
        setBilibiliError('视频信息获取失败: ' + (data.message || '未知错误'))
        setBilibiliLoading(false)
        return
      }
      
      const v = data.data
      setBilibiliPreview({
        title: v.title || '',
        duration: v.duration || 0,
        coverUrl: v.pic || '',
        videoId: bvid,
        sourceUrl: `https://www.bilibili.com/video/${bvid}`,
        description: v.desc || '',
        owner: v.owner?.name || '',
      })
      
      // Pre-fill form
      setUploadData({
        title: v.title || '',
        titleEn: v.title || '',
        category: detectCategory(v.title || '') as Material['category'],
        difficulty: 'intermediate',
        transcript: '',
        translation: '',
        sourceUrl: `https://www.bilibili.com/video/${bvid}`,
        videoId: bvid,
        coverUrl: v.pic || '',
      })
    } catch (e: any) {
      setBilibiliError('网络错误: ' + e.message)
    }
    setBilibiliLoading(false)
  }
  
  const detectCategory = (title: string): string => {
    const t = title.toLowerCase()
    if (t.includes('新闻') || t.includes('news')) return 'news'
    if (t.includes('采访') || t.includes('访谈') || t.includes('interview')) return 'interview'
    if (t.includes('记录') || t.includes('documentary')) return 'documentary'
    if (t.includes('演讲') || t.includes('speech') || t.includes('ted')) return 'speech'
    if (t.includes('ted')) return 'ted'
    return 'speech'
  }
  
  const filteredMaterials = materials.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) || 
                       m.titleEn.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === 'all' || m.category === category
    const matchDifficulty = difficulty === 'all' || m.difficulty === difficulty
    return matchSearch && matchCategory && matchDifficulty
  })
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // For demo, we use a placeholder audio URL
      // In production, you'd upload to a server or use IndexedDB
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      setUploadData(prev => ({
        ...prev,
        titleEn: nameWithoutExt,
        title: nameWithoutExt
      }))
    }
  }
  
  const handleUpload = () => {
    if (!uploadData.title || !uploadData.transcript) return
    
    const newMaterial: Material = {
      id: Date.now().toString(),
      title: uploadData.title,
      titleEn: uploadData.titleEn || uploadData.title,
      duration: (uploadData as any).duration || 1200,
      category: uploadData.category,
      difficulty: uploadData.difficulty,
      audioUrl: '/samples/placeholder.mp3',
      transcript: uploadData.transcript,
      translation: uploadData.translation,
      sourceUrl: (uploadData as any).sourceUrl,
      videoId: (uploadData as any).videoId,
      coverUrl: (uploadData as any).coverUrl,
      createdAt: Date.now(),
      status: 'pending'
    }
    
    addMaterial(newMaterial)
    setShowUploadModal(false)
    setUploadData({
      title: '',
      titleEn: '',
      category: 'news',
      difficulty: 'intermediate',
      transcript: '',
      translation: '',
      sourceUrl: '',
      videoId: '',
      coverUrl: ''
    })
    setBilibiliUrl('')
    setBilibiliPreview(null)
    setBilibiliError('')
  }
  
  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">素材库</h1>
        <p className="text-[var(--color-text-secondary)]">
          选择你感兴趣的素材，开启四阶段学习之旅
        </p>
      </motion.div>
      
      {/* Filter Bar */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-[var(--color-bg-secondary)] rounded-xl p-4 mb-6 border border-[var(--color-border)]"
      >
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="搜索素材标题..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg pl-10 pr-4 py-2.5 text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>
          
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[var(--color-text-secondary)]" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Material['category'] | 'all')}
              className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            >
              <option value="all">全部分类</option>
              <option value="news">新闻</option>
              <option value="interview">访谈</option>
              <option value="documentary">纪录片</option>
              <option value="speech">演讲</option>
              <option value="ted">TED</option>
            </select>
          </div>
          
          {/* Difficulty Filter */}
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--color-text-secondary)]" />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Material['difficulty'] | 'all')}
              className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            >
              <option value="all">全部难度</option>
              <option value="beginner">初级</option>
              <option value="intermediate">中级</option>
              <option value="advanced">高级</option>
            </select>
          </div>
          
          {/* Upload Button */}
          <button 
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
          >
            <Upload className="w-5 h-5" />
            上传素材
          </button>
        </div>
      </motion.div>
      
      {/* Materials List */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredMaterials.map((material, index) => (
            <motion.div
              key={material.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className="card group cursor-pointer hover:border-[var(--color-accent)]"
              onClick={() => navigate(`/dictation/${material.id}`)}
            >
              <div className="flex items-center gap-6">
                {/* Play Icon */}
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-amber-500 ml-1" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-lg truncate">{material.titleEn}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColors[material.difficulty]}`}>
                      {difficultyLabels[material.difficulty]}
                    </span>
                    {material.status !== 'pending' && material.status !== 'completed' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                        进行中
                      </span>
                    )}
                    {material.status === 'completed' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                        已完成
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--color-text-secondary)] text-sm mb-2">{material.title}</p>
                  <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {Math.floor(material.duration / 60)} 分钟
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      {categoryLabels[material.category]}
                    </span>
                  </div>
                </div>
                
                {/* Progress if any */}
                {material.status !== 'pending' && (
                  <div className="text-right pr-4">
                    <div className="text-sm font-medium text-[var(--color-accent)]">
                      {material.status === 'dictation' && '第一阶段'}
                      {material.status === 'understanding' && '第二阶段'}
                      {material.status === 'recitation' && '第三阶段'}
                    </div>
                  </div>
                )}
                
                <ChevronRight className="w-6 h-6 text-[var(--color-text-secondary)] group-hover:translate-x-1 group-hover:text-[var(--color-accent)] transition-all" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      
      {/* Empty State */}
      {filteredMaterials.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Sparkles className="w-16 h-16 text-[var(--color-text-secondary)] mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">未找到匹配素材</h3>
          <p className="text-[var(--color-text-secondary)]">
            尝试调整搜索条件或筛选器
          </p>
        </motion.div>
      )}
      
      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">上传新素材</h2>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Upload Mode Tabs */}
              <div className="flex mb-6 bg-[var(--color-bg-tertiary)] rounded-lg p-1">
                <button
                  onClick={() => setUploadMode('bilibili')}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                    uploadMode === 'bilibili' 
                      ? 'bg-[var(--color-bg-secondary)] text-[var(--color-accent)]' 
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <Link className="w-4 h-4 inline mr-1" />
                  B站链接导入
                </button>
                <button
                  onClick={() => setUploadMode('file')}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                    uploadMode === 'file' 
                      ? 'bg-[var(--color-bg-secondary)] text-[var(--color-accent)]' 
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <Upload className="w-4 h-4 inline mr-1" />
                  本地上传
                </button>
              </div>

              {/* B站链接导入 */}  
              {uploadMode === 'bilibili' && (
                <div className="mb-6">
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                    粘贴B站视频链接
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={bilibiliUrl}
                      onChange={(e) => { setBilibiliUrl(e.target.value); setBilibiliError(''); setBilibiliPreview(null) }}
                      onKeyDown={(e) => e.key === 'Enter' && handleBilibiliImport()}
                      placeholder="https://www.bilibili.com/video/BV..."
                      className="flex-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-accent)]"
                    />
                    <button
                      onClick={handleBilibiliImport}
                      disabled={bilibiliLoading || !bilibiliUrl.trim()}
                      className="btn btn-primary text-sm disabled:opacity-50"
                    >
                      {bilibiliLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      解析
                    </button>
                  </div>
                  {bilibiliError && (
                    <p className="text-red-400 text-sm mt-2">{bilibiliError}</p>
                  )}
                  {bilibiliPreview && (
                    <div className="mt-4 p-4 bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--color-border)]">
                      <div className="flex gap-4">
                        {bilibiliPreview.coverUrl && (
                          <img 
                            src={bilibiliPreview.coverUrl} 
                            alt={bilibiliPreview.title}
                            className="w-32 h-20 rounded-lg object-cover"
                            crossOrigin="anonymous"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{bilibiliPreview.title}</h4>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                            UP: {bilibiliPreview.owner}
                            {' · '}
                            {Math.floor(bilibiliPreview.duration / 60)}:
                            {String(Math.floor(bilibiliPreview.duration % 60)).padStart(2, '0')}
                          </p>
                          <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            自动识别：已填入标题和时长
                          </p>
                          <div className="mt-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <p className="text-xs text-amber-400 flex items-center gap-1 mb-2">
                              <Sparkles className="w-3 h-3" />
                              自动转录：可通过流水线生成英文原文和中文翻译
                            </p>
                            <div className="bg-[var(--color-bg-secondary)] rounded p-2 text-xs font-mono text-[var(--color-text-secondary)] overflow-x-auto">
                              {`HF_ENDPOINT=https://hf-mirror.com python3 pipeline.py "${bilibiliUrl}" -o ./output`}
                            </div>
                            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                              需要安装：pip install faster-whisper yt-dlp openai · 
                              <a href="https://github.com/yucben/echo-learning/tree/master/tools/bilibili-asr" 
                                 target="_blank" className="text-amber-400 hover:underline">
                                查看文档
                              </a>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {!bilibiliPreview && !bilibiliError && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                      支持 BV 号链接、b23.tv 短链。识别后自动填入视频信息。
                    </p>
                  )}
                </div>
              )}

              {/* File Input (only in file mode) */}
              {uploadMode === 'file' && (
              <div
                className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center mb-6 cursor-pointer hover:border-[var(--color-accent)] transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <FileAudio className="w-12 h-12 text-[var(--color-text-secondary)] mx-auto mb-4" />
                <p className="font-medium mb-1">点击选择音频文件</p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  支持 MP3, WAV, M4A 格式
                </p>
              </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                      素材标题（英文）
                    </label>
                    <input
                      type="text"
                      value={uploadData.titleEn}
                      onChange={(e) => setUploadData({...uploadData, titleEn: e.target.value})}
                      placeholder="如：BBC News - Climate Change"
                      className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                      中文标题
                    </label>
                    <input
                      type="text"
                      value={uploadData.title}
                      onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                      placeholder="如：气候变化报道"
                      className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                      分类
                    </label>
                    <select
                      value={uploadData.category}
                      onChange={(e) => setUploadData({...uploadData, category: e.target.value as Material['category']})}
                      className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2"
                    >
                      <option value="news">新闻</option>
                      <option value="interview">访谈</option>
                      <option value="documentary">纪录片</option>
                      <option value="speech">演讲</option>
                      <option value="ted">TED演讲</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                      难度
                    </label>
                    <select
                      value={uploadData.difficulty}
                      onChange={(e) => setUploadData({...uploadData, difficulty: e.target.value as Material['difficulty']})}
                      className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2"
                    >
                      <option value="beginner">初级</option>
                      <option value="intermediate">中级</option>
                      <option value="advanced">高级</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                    英文原文 *
                  </label>
                  <textarea
                    value={uploadData.transcript}
                    onChange={(e) => setUploadData({...uploadData, transcript: e.target.value})}
                    placeholder="粘贴英文原文..."
                    className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 h-40 resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                    中文翻译（可选）
                  </label>
                  <textarea
                    value={uploadData.translation}
                    onChange={(e) => setUploadData({...uploadData, translation: e.target.value})}
                    placeholder="粘贴中文翻译..."
                    className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 h-32 resize-none"
                  />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button 
                  onClick={handleUpload}
                  disabled={!uploadData.title || !uploadData.transcript}
                  className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-5 h-5" />
                  上传素材
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
