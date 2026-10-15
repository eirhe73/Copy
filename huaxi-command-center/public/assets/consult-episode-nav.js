/**
 * 远程会诊演示流：优先进入「连续诊疗与交接」(#/episode)，再从此页进入视频会诊室 (#/room)。
 */
;(function () {
  var journeyByPatient = null
  var journeyByToken = null

  function rebuildIndex(state) {
    journeyByPatient = new Map()
    journeyByToken = new Map()
    if (!state) return
    ;(state.journeys || []).forEach(function (j) {
      if (j && j.patientId && j.id) journeyByPatient.set(String(j.patientId), String(j.id))
    })
    ;(state.consultationRequests || []).forEach(function (cr) {
      if (!cr || !cr.token) return
      var jid = cr.patientId && journeyByPatient.get(String(cr.patientId))
      if (jid) journeyByToken.set(String(cr.token), jid)
    })
    ;(state.patients || []).forEach(function (p) {
      if (!p || !p.consultationToken || !p.id) return
      var jid = journeyByPatient.get(String(p.id))
      if (jid) journeyByToken.set(String(p.consultationToken), jid)
    })
  }

  function indexFromScenario(state) {
    rebuildIndex(state)
  }

  function loadScenarioIndex() {
    return fetch('/scenario.json', { cache: 'no-store' })
      .then(function (r) {
        return r.ok ? r.json() : null
      })
      .then(function (pack) {
        var st = (pack && pack.state) || pack || {}
        rebuildIndex(st)
        return st
      })
      .catch(function () {
        rebuildIndex(null)
        return null
      })
  }

  /** @returns {string} hash route like #/episode/J-FIELD-003 */
  function episodeHash(opts) {
    opts = opts || {}
    var patientId = opts.patientId != null ? String(opts.patientId) : ''
    var token = opts.token != null ? String(opts.token) : ''
    var jid = ''
    if (patientId && journeyByPatient) jid = journeyByPatient.get(patientId) || ''
    if (!jid && token && journeyByToken) jid = journeyByToken.get(token) || ''
    if (jid) return '#/episode/' + encodeURIComponent(jid)
    if (patientId) return '#/patient/' + encodeURIComponent(patientId)
    return ''
  }

  function goEpisode(opts) {
    var h = episodeHash(opts)
    if (!h) return false
    assignHash(h)
    return true
  }

  /** app.html 内只用 #/…，勿用 /#/…（会离开 app.html） */
  function normalizeHash(href) {
    if (!href) return ''
    var h = String(href).trim()
    if (h.indexOf('/#/') === 0) return h.slice(1)
    return h
  }

  function assignHash(href) {
    var h = normalizeHash(href)
    if (h.charAt(0) === '#') location.hash = h
  }

  window.hxConsultEpisodeNav = {
    indexFromScenario: indexFromScenario,
    loadScenarioIndex: loadScenarioIndex,
    episodeHash: episodeHash,
    goEpisode: goEpisode,
    normalizeHash: normalizeHash,
    assignHash: assignHash,
  }
})()
