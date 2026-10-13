/** 各路由可用的写接口（与 backend-api-catalog.js HX_API_WRITE_BODY 对齐） */

export type RouteWriteAction = {
  label: string
  method: 'POST' | 'PUT' | 'DELETE'
  /** catalog 模板路径，如 /warnings/{id}/dispose */
  pathTemplate: string
  /** 默认 body；{id} 等由 params 或 prompt 填充 */
  body?: Record<string, unknown> | (() => Record<string, unknown>)
  /** 缺少 id 时是否 prompt */
  promptId?: boolean
}

export const ROUTE_WRITE_ACTIONS: Record<string, RouteWriteAction[]> = {
  '/register': [
    {
      label: '提交院前登记 (POST /dispatch/patients)',
      method: 'POST',
      pathTemplate: '/dispatch/patients',
      body: {
        name: '试调用患者',
        gender: 'MALE',
        chiefComplaint: '试调用',
        isDraft: 1,
      },
    },
  ],
  '/warning': [
    {
      label: '处置预警 (需 ID)',
      method: 'POST',
      pathTemplate: '/warnings/{id}/dispose',
      body: { stage: '护士确认', note: '前端处置', nextStatus: 'acknowledged' },
      promptId: true,
    },
  ],
  '/monitoring': [
    {
      label: '云台停止',
      method: 'POST',
      pathTemplate: '/monitoring/ptz',
      body: { stream_id: '1', action: 'stop' },
    },
  ],
  '/critical': [
    {
      label: '查房记录 (需 ward ID)',
      method: 'POST',
      pathTemplate: '/critical/wards/{id}/note',
      body: { note_text: '前端查房记录' },
      promptId: true,
    },
  ],
  '/transfers': [
    {
      label: '确认转诊 (需 ID)',
      method: 'POST',
      pathTemplate: '/transfers/{id}/confirm',
      body: { review_note: '前端确认' },
      promptId: true,
    },
  ],
  '/room/:token': [
    {
      label: '提交会诊意见',
      method: 'POST',
      pathTemplate: '/rooms/{token}/opinions',
      body: { opinion_text: '前端会诊意见', author_name: '演示医生' },
    },
  ],
  '/join/:token': [
    {
      label: '提交会诊意见',
      method: 'POST',
      pathTemplate: '/rooms/{token}/opinions',
      body: { opinion_text: '患者端意见', author_name: '患者' },
    },
  ],
  '/consultations': [
    {
      label: '接诊会诊 (需 sessionId)',
      method: 'POST',
      pathTemplate: '/consultations/{sessionId}/accept',
      body: {},
      promptId: true,
    },
  ],
  '/settings': [
    {
      label: '演示数据重置',
      method: 'POST',
      pathTemplate: '/settings/demo-reset',
      body: {},
    },
  ],
  '/devices': [
    {
      label: '新建设备 (示例)',
      method: 'POST',
      pathTemplate: '/devices',
      body: { name: '试调用设备', type: 'monitor' },
    },
  ],
}
