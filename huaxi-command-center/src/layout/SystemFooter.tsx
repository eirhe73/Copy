import { Bell, Settings, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function SystemFooter() {
  const { user } = useAuth()
  const scope =
    user && typeof user === 'object' && (user as { kind?: string }).kind === 'admin'
      ? '全域数据范围'
      : '华西演示 · API 后端'

  return (
    <footer className="system-footer">
      <span>
        <i /> 本地演示环境 · 数据来自 Laravel API
      </span>
      <span>{scope}</span>
      <div>
        <Link to="/coordination">
          <Users size={12} /> 任务协同
        </Link>
        <Link to="/messages">
          <Bell size={12} /> 通知
        </Link>
        <Link to="/settings">
          <Settings size={12} /> 设置
        </Link>
      </div>
    </footer>
  )
}
