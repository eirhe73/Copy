/** 与线上一致的五大业务模块顶栏（reference/original-index.js → HP） */
export type IaPlate = {
  title: string
  home: string
  links: [path: string, label: string][]
}

export const IA_PLATES: IaPlate[] = [
  {
    title: '智慧急救调度',
    home: '/dispatch',
    links: [
      ['/dispatch', '实时出警'],
      ['/dispatch/list', '出警列表'],
      ['/ambulances', '救护车列表'],
      ['/patients', '患者列表'],
      ['/register', '患者登记'],
      ['/consultations', '远程会诊'],
      ['/consultations?tab=grassroots', '基层会诊'],
      ['/transfers?scope=grassroots', '医院转诊'],
      ['/critical?mode=grassroots-remote', '基层远程监护'],
    ],
  },
  {
    title: '院内早期预警',
    home: '/warning',
    links: [
      ['/warning', '预警总览'],
      ['/warning?view=departments', '科室监控'],
      ['/patients?focus=1', '重点关注'],
      ['/messages', '预警通知'],
      ['/quality', '运行统计'],
    ],
  },
  {
    title: '县域智慧重症',
    home: '/critical',
    links: [
      ['/critical', '重症监护'],
      ['/critical?view=wards', '床位全景'],
      ['/critical?mode=town', '乡镇监护'],
      ['/devices', '床旁设备'],
      ['/centers', '五大中心'],
      ['/organizations', '协作机构'],
    ],
  },
  {
    title: '智能医疗质控',
    home: '/medical-quality',
    links: [
      ['/medical-quality', '质控整改看板'],
      ['/medical-quality/reports', '业务统计'],
    ],
  },
  {
    title: '基层医声Dr.',
    home: '/dr',
    links: [
      ['/dr?view=videos', '视频展示'],
      ['/dr?view=saved', '我的收藏'],
    ],
  },
]
