import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { RouteApiWorkspace } from '../../components/data/RouteApiWorkspace'
import { apiGet } from '../../lib/apiClient'
import { APP_ROUTES } from '../../routes/meta'
import { ROUTE_API_BINDINGS } from '../../routes/apiBindings'
import { ROUTE_WRITE_ACTIONS } from '../../routes/apiWrites'

const ROOM_PATH = '/room/:token'

type RoomMedia = { mediaMode?: string; rtcReady?: boolean; notice?: string }
type RoomInfo = { sessionId?: string; media?: RoomMedia }
type JoinLink = { joinUrl?: string; rtcReady?: boolean; role?: string }

/**
 * 会诊室：在原后端数据面板之上增加"进入视频会诊"入口。
 * 入会链接由主系统后端签发（/consultations/{sessionId}/join-link），
 * 房主走一次性 ownerTicket，受邀专家走 joinToken，拿到后新窗口打开会诊系统。
 */
export function ConsultRoomPage() {
  const params = useParams()
  const token = params.token
  const meta = APP_ROUTES.find((r) => r.path === ROOM_PATH)
  const bindings = ROUTE_API_BINDINGS[ROOM_PATH] ?? []
  const writes = ROUTE_WRITE_ACTIONS[ROOM_PATH] ?? []

  const [sessionId, setSessionId] = useState('')
  const [rtcReady, setRtcReady] = useState(false)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    let alive = true
    apiGet<RoomInfo>(`/rooms/${encodeURIComponent(token)}`)
      .then((room) => {
        if (!alive) return
        setSessionId(room.sessionId ?? '')
        setRtcReady(Boolean(room.media?.rtcReady))
        setNotice(room.media?.notice ?? '')
      })
      .catch(() => {
        if (alive) setNotice('会诊室信息加载失败')
      })
    return () => {
      alive = false
    }
  }, [token])

  async function enterConsultation() {
    if (!sessionId || busy) return
    setBusy(true)
    setError('')
    try {
      // 加时间戳绕过前端 GET 缓存，避免复用已过期的房主票据
      const link = await apiGet<JoinLink>(
        `/consultations/${encodeURIComponent(sessionId)}/join-link?_t=${Date.now()}`,
      )
      if (!link.joinUrl) {
        setError('未获取到入会链接，请稍后重试')
        return
      }
      window.open(link.joinUrl, '_blank', 'noopener')
    } catch {
      setError('获取入会链接失败，请稍后重试')
    } finally {
      setBusy(false)
    }
  }

  if (!meta) return null

  return (
    <>
      <section className="panel">
        <h3>音视频会诊</h3>
        {rtcReady ? (
          <>
            <p className="api-muted">会诊已接入远程会诊系统，点击下方按钮进入视频会诊室。</p>
            <button
              type="button"
              className="btn-primary"
              onClick={enterConsultation}
              disabled={busy || !sessionId}
            >
              {busy ? '正在获取入会链接…' : '进入视频会诊'}
            </button>
          </>
        ) : (
          <p className="api-muted">{notice || '音视频服务未就绪，暂不可发起视频会诊。'}</p>
        )}
        {error ? <p className="api-muted">{error}</p> : null}
      </section>

      <RouteApiWorkspace
        meta={meta}
        bindings={bindings}
        params={{ ...params }}
        writes={writes}
        className="workspace screen"
      />
    </>
  )
}
