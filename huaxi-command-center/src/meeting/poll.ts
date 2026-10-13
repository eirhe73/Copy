export function startPoll<T>(fetcher: () => Promise<T>, onData: (d: T) => void, ms = 5000) {
  let stopped = false
  const tick = async () => {
    if (stopped) return
    try {
      onData(await fetcher())
    } catch {
      /* ignore */
    }
  }
  tick()
  const id = window.setInterval(tick, ms)
  return () => {
    stopped = true
    clearInterval(id)
  }
}
