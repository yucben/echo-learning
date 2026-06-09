import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Library,
  Settings,
  Mic,
  Github,
  ExternalLink,
  Menu,
  X
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const navItems = [
  { path: '/', icon: Home, label: '学习中心' },
  { path: '/materials', icon: Library, label: '素材库' },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // 关闭抽屉当路由变化
  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-14 sm:h-16 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]
                         flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600
                          flex items-center justify-center flex-shrink-0">
            <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
          </div>
          <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600
                           bg-clip-text text-transparent truncate">
            EchoLearning
          </span>
        </div>

        {/* 桌面导航 */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)]'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* 桌面右侧按钮组 */}
        <div className="hidden md:flex items-center gap-2">
          <a
            href="https://github.com/yucben/echo-learning"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--color-text-secondary)]
                       hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            <Github className="w-4 h-4" />
            <span className="text-sm">查看源代码</span>
          </a>
          <button className="p-2 rounded-lg text-[var(--color-text-secondary)]
                             hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* 移动端：汉堡按钮 */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2 rounded-lg text-[var(--color-text-secondary)]
                     hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors
                     min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="打开菜单"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* 移动端抽屉菜单 */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={closeMobileMenu}
            />
            {/* 抽屉 */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-[var(--color-bg-secondary)]
                         border-l border-[var(--color-border)] z-50 md:hidden flex flex-col"
            >
              {/* 抽屉头部 */}
              <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--color-border)] flex-shrink-0">
                <span className="font-semibold text-[var(--color-text)]">菜单</span>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-lg text-[var(--color-text-secondary)]
                             hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)]
                             min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="关闭菜单"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* 抽屉导航 */}
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] ${
                        isActive
                          ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-accent)]'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)]'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              {/* 抽屉底部 */}
              <div className="p-4 border-t border-[var(--color-border)] space-y-2 flex-shrink-0">
                <a
                  href="https://yucben.github.io/echo-learning/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg
                             text-[var(--color-text-secondary)] hover:text-[var(--color-text)]
                             hover:bg-[var(--color-bg-tertiary)] transition-colors min-h-[44px]"
                >
                  <ExternalLink className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">在线预览</span>
                </a>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                             text-[var(--color-text-secondary)] hover:text-[var(--color-text)]
                             hover:bg-[var(--color-bg-tertiary)] transition-colors min-h-[44px]"
                >
                  <Settings className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">设置</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer Progress Bar */}
      <footer className="h-2 bg-[var(--color-bg-secondary)]">
        <div className="h-full progress-bar">
          <div className="progress-bar-fill" style={{ width: '15%' }} />
        </div>
      </footer>
    </div>
  )
}
