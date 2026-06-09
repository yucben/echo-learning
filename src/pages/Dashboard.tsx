import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Play, 
  BookOpen, 
  PenTool, 
  Mic, 
  Headphones,
  Target,
  Clock,
  Zap,
  ChevronRight,
  Library,

  Brain,
  Volume2
} from 'lucide-react'
import { useStore } from '../utils/store'

const stages = [
  { 
    id: 'dictation', 
    name: '盲听听写', 
    icon: PenTool, 
    color: 'from-blue-500 to-blue-600',
    description: '训练耳朵对每个单词的敏感度',
    path: '/materials'
  },
  { 
    id: 'understanding', 
    name: '深度理解', 
    icon: BookOpen, 
    color: 'from-emerald-500 to-emerald-600',
    description: '消除所有知识盲点',
    path: '/materials'
  },
  { 
    id: 'recitation', 
    name: '极限背诵', 
    icon: Mic, 
    color: 'from-amber-500 to-amber-600',
    description: '形成语感和语言习惯',
    path: '/materials'
  },
]

const methodDetails = [
  {
    step: 1,
    title: '素材筛选',
    subtitle: '兴趣驱动',
    icon: Target,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    points: [
      '音频长度建议 20 分钟左右',
      '选择新闻、访谈、科普纪录片',
      '语法规整、表达稳定',
      '必须是你感兴趣的内容'
    ]
  },
  {
    step: 2,
    title: '盲听听写',
    subtitle: '感官辨析',
    icon: Headphones,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    points: [
      '直接盲听，不看原文',
      '训练耳朵对单词的敏感度',
      '以耳朵辨析为主',
      '产出完整听写文稿'
    ]
  },
  {
    step: 3,
    title: '深度理解',
    subtitle: '逻辑内化',
    icon: Brain,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    points: [
      '研读听写出的文章',
      '查阅单词、分析语法',
      '彻底吃透长难句逻辑',
      '达到完全理解'
    ]
  },
  {
    step: 4,
    title: '极限背诵',
    subtitle: '语感形成',
    icon: Volume2,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    points: [
      '脱稿背诵',
      '语速与原音频同步',
      '达到不假思索的程度',
      '脑中建立条件反射'
    ]
  }
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { materials, stats } = useStore()
  
  const inProgress = materials.filter(m => m.status !== 'pending' && m.status !== 'completed')
  const completed = materials.filter(m => m.status === 'completed')
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-10"
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          欢迎回来，<span className="text-[var(--color-accent)]">英语学习者</span>
        </h1>
        <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">
          坚持四阶段学习法，让你的听力突飞猛进
        </p>
      </motion.div>

      {/* Stats Grid — 2列手机 / 4列桌面 */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-10"
      >
        <motion.div variants={item} className="card flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold">{Math.floor(stats.totalTime / 60)}</p>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] truncate">学习分钟</p>
          </div>
        </motion.div>

        <motion.div variants={item} className="card flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold">{completed.length}</p>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] truncate">已完成素材</p>
          </div>
        </motion.div>

        <motion.div variants={item} className="card flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold">{stats.currentStreak}</p>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] truncate">连续天数</p>
          </div>
        </motion.div>

        <motion.div variants={item} className="card flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold">{stats.wordsLearned}</p>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] truncate">掌握词汇</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Learning Stages — 1列手机 / 2列平板 / 3列桌面 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6 sm:mb-10"
      >
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">四阶段学习法</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {stages.map((stage, index) => (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="card cursor-pointer group"
              onClick={() => navigate(stage.path)}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stage.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <stage.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-1">{stage.name}</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">{stage.description}</p>
              <div className="mt-4 flex items-center text-[var(--color-accent)] text-sm font-medium">
                <span>开始学习</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* Method Explanation — 1列手机 / 2列平板 / 4列桌面 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mb-6 sm:mb-10"
      >
        <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">四阶段学习法详解</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {methodDetails.map((method, index) => (
            <motion.div
              key={method.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="card"
            >
              <div className={`w-10 h-10 rounded-lg ${method.bg} flex items-center justify-center mb-4`}>
                <method.icon className={`w-5 h-5 ${method.color}`} />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">阶段 {method.step}</span>
                <span className={`text-xs ${method.color}`}>({method.subtitle})</span>
              </div>
              <h3 className="font-semibold mb-3">{method.title}</h3>
              <ul className="space-y-2">
                {method.points.map((point, i) => (
                  <li key={i} className="text-sm text-[var(--color-text-secondary)] flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-[var(--color-text-secondary)] mt-2 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* Current Progress */}
      {inProgress.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">进行中的学习</h2>
          <div className="space-y-3">
            {inProgress.map((material) => (
              <div
                key={material.id}
                className="card flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 cursor-pointer hover:border-[var(--color-accent)]"
                onClick={() => navigate(`/dictation/${material.id}`)}
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[var(--color-bg-tertiary)] flex items-center justify-center flex-shrink-0">
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-accent)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{material.titleEn}</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] truncate">{material.title}</p>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pl-15 sm:pl-0 sm:text-right gap-2">
                  <span className="text-sm text-[var(--color-accent)] whitespace-nowrap">
                    {material.status === 'dictation' && '听写中'}
                    {material.status === 'understanding' && '理解中'}
                    {material.status === 'recitation' && '背诵中'}
                  </span>
                  <p className="text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
                    {Math.floor(material.duration / 60)} 分钟
                  </p>
                </div>
                <ChevronRight className="hidden sm:block w-5 h-5 text-[var(--color-text-secondary)] flex-shrink-0" />
              </div>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Empty State */}
      {inProgress.length === 0 && completed.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center py-12 sm:py-16 px-4"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center mx-auto mb-6">
            <Play className="w-10 h-10 text-amber-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">开始你的学习之旅</h3>
          <p className="text-[var(--color-text-secondary)] mb-6">
            从素材库选择一篇素材，开始四阶段学习
          </p>
          <button 
            onClick={() => navigate('/materials')}
            className="btn btn-primary"
          >
            <Library className="w-5 h-5" />
            浏览素材库
          </button>
        </motion.div>
      )}
    </div>
  )
}
