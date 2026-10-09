// ============================================================
// main.js — 课表页面主逻辑
// ============================================================
// 这个文件负责：
//   1. 课程配色分配
//   2. 周选择页渲染
//   3. 常规课表渲染（含当前节次高亮）
//   4. 视图切换 / 周切换动画
//   5. 课程详情弹窗
//   6. 调休课表渲染
//   7. 手机端返回键拦截（课表→周选择→双击退出）
// 所有可调参数都在 js/config.js，这里一般不用改。
// ============================================================

// ============================================================
// 0. SVG 图标库（矢量、清晰、随文字颜色变色）
// ============================================================
// fill="currentColor" 表示继承父元素文字颜色：课程块上是白色，弹窗里是深色
const ICONS = {
  // 位置定位针
  pin: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  // 老师（人头+肩）
  teacher:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  // 学分（毕业证书）
  credit:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
  // 日历（调休入口）
  calendar:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
}
// 注入图标尺寸样式
;(function injectIconCss () {
  const style = document.createElement('style')
  style.textContent = `.icon { width: 1em; height: 1em; vertical-align: -0.125em; margin-right: 3px; }`
  document.head.appendChild(style)
})()

// ============================================================
// 1. 课程配色
// ============================================================
// 同一门课固定一个颜色，不同课自动按顺序分配 N 种配色。
// COLOR_MAP：课程名 → 配色类名（如 "c-blue"）
// COLORS    ：配色候选列表（在 style.css 里定义了对应渐变）
const COLOR_MAP = {}
const COLORS = [
  'c-blue',
  'c-green',
  'c-orange',
  'c-pink',
  'c-purple',
  'c-cyan',
  'c-red',
  'c-indigo',
  'c-teal',
  'c-amber',
  'c-rose',
  'c-violet',
  'c-emerald',
  'c-sky',
  'c-lime',
  'c-fuchsia',
  'c-slate',
  'c-grape',
  'c-mint',
  'c-peach'
]
let colorIdx = 0
function getColor (name) {
  if (!COLOR_MAP[name]) {
    COLOR_MAP[name] = COLORS[colorIdx % COLORS.length]
    colorIdx++
  }
  return COLOR_MAP[name]
}

// ============================================================
// 2. 工具函数
// ============================================================

// Date → "M月D日" 短日期
function formatDate (d) {
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

// 第 weekNum 周的周一日期
function getWeekMonday (weekNum) {
  const d = new Date(SEMESTER_START)
  d.setDate(d.getDate() + (weekNum - 1) * 7)
  return d
}

// 判断某门课在第 weekNum 周是否上课（按 startWeek~endWeek 区间）
function eventInWeek (ev, weekNum) {
  return weekNum >= ev.startWeek && weekNum <= ev.endWeek
}

// 从开学日算起，今天是第几周（限制在 1~TOTAL_WEEKS）
function getCurrentWeek () {
  const now = new Date()
  const diff = Math.floor((now - SEMESTER_START) / (7 * 24 * 3600 * 1000))
  let w = diff + 1
  if (w < 1) w = 1
  if (w > TOTAL_WEEKS) w = TOTAL_WEEKS
  return w
}

// 全局状态：当前看的是第几周
let currentWeek = 1
// 动画锁：视图切换 / 周切换动画进行中时忽略新请求，避免快速点击导致动画打架
let viewLock = false

// ============================================================
// 3. 周选择页渲染
// ============================================================
function renderWeekGrid () {
  const grid = document.getElementById('weekGrid')
  const cur = getCurrentWeek()
  let html = ''
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const mon = getWeekMonday(w)
    const sun = new Date(mon)
    sun.setDate(sun.getDate() + 6)
    const isCur = w === cur
    const tag = WEEK_TAGS[w]
      ? `<span class="week-tag">${WEEK_TAGS[w]}</span>`
      : ''
    html += `
      <div class="week-btn ${isCur ? 'current' : ''}" style="--i:${
      w - 1
    }" onclick="selectWeek(${w})">
        <div class="week-num">第 ${w} 周</div>
        <div class="week-date">${formatDate(mon)} - ${formatDate(sun)}</div>
        ${tag}
      </div>`
  }
  grid.innerHTML = html
}

// ============================================================
// 4. 常规课表渲染
// ============================================================
// weekNum：要显示第几周
// dir    ：0=首次进入（课程块交错入场）；1/-1=上一周/下一周切换（表格整体滑动）
function renderSchedule (weekNum, dir) {
  currentWeek = weekNum
  currentPeriodNum = getCurrentPeriodNum() // 每次渲染都重新读当前时间
  const table = document.getElementById('scheduleTable')
  table.dataset.dir = String(dir || 0)
  const mon = getWeekMonday(weekNum)
  const sun = new Date(mon)
  sun.setDate(sun.getDate() + 6)
  document.getElementById('weekTitle').textContent = `第 ${weekNum} 周`
  document.getElementById('prevWeek').disabled = weekNum <= 1
  document.getElementById('nextWeek').disabled = weekNum >= TOTAL_WEEKS

  // ---- 表头（节次 + SHOW_DAYS 配置的那几天）----
  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const today = new Date()
  let headerHtml = '<th class="period-col">节次</th>'
  SHOW_DAYS.forEach(d => {
    const dayDate = new Date(mon)
    dayDate.setDate(dayDate.getDate() + (d - 1))
    const isToday = today.toDateString() === dayDate.toDateString()
    headerHtml += `<th class="${isToday ? 'today' : ''}">${
      dayNames[d - 1]
    }<br><span style="font-size:11px;font-weight:400;color:#94a3b8">${
      dayDate.getMonth() + 1
    }/${dayDate.getDate()}</span></th>`
  })
  document.getElementById('dayHeader').innerHTML = headerHtml

  // ---- 课程查找表：key = "day_sec"，value = 该格对应的课程 ----
  const cellMap = {}
  EVENTS.forEach(ev => {
    if (eventInWeek(ev, weekNum)) {
      for (let s = ev.startSec; s <= ev.endSec; s++) {
        cellMap[`${ev.day}_${s}`] = ev
      }
    }
  })

  // ---- 表体：逐节次 × 逐天 ----
  let bodyHtml = ''
  PERIODS.forEach((p, idx) => {
    // 当前节次那一行的首列加 now-period 高亮
    bodyHtml += `<tr><td class="period-col${
      p.num === currentPeriodNum ? ' now-period' : ''
    }"><div class="period-label">第${p.num}节</div><div class="period-time">${
      p.start
    }~${p.end}</div></td>`
    SHOW_DAYS.forEach(d => {
      const ev = cellMap[`${d}_${p.num}`]
      if (ev) {
        // 只在课程开始节次渲染 block（后面节次用 rowspan 合并）
        if (ev.startSec === p.num) {
          const rowSpan = ev.endSec - ev.startSec + 1
          const credit = ev.credit
          bodyHtml += `<td class="course-cell" rowspan="${rowSpan}">
            <div class="course-block ${getColor(
              ev.summary
            )}" style="--i:${Math.min(
            idx,
            10
          )}" onclick='showModal(${JSON.stringify(ev).replace(/'/g, '&#39;')})'>
              <div class="course-name">${ev.summary}</div>
              ${
                credit !== undefined
                  ? `<div class="course-credit">${ICONS.credit}${credit}学分</div>`
                  : ''
              }
              ${
                ev.location
                  ? `<div class="course-loc">${ICONS.pin}${ev.location}</div>`
                  : ''
              }
              ${
                ev.teacher
                  ? `<div class="course-teacher">${ICONS.teacher}${ev.teacher}</div>`
                  : ''
              }
              ${ev.note ? `<div class="course-note">${ev.note}</div>` : ''}
            </div>
          </td>`
        }
        // 否则不输出 td（被前一节的 rowspan 占了）
      } else {
        bodyHtml += `<td class="course-cell empty-cell"></td>`
      }
    })
    bodyHtml += `</tr>`
  })
  document.getElementById('scheduleBody').innerHTML = bodyHtml
}

// ============================================================
// 5. 视图切换（带动画）
// ============================================================
// hideId：要隐藏的视图 id；showId：要显示的视图 id；afterShow：动画结束后的回调
function switchView (hideId, showId, afterShow) {
  if (viewLock) return
  viewLock = true
  const hide = document.getElementById(hideId)
  const show = document.getElementById(showId)
  hide.classList.add('view-exit')
  setTimeout(() => {
    hide.classList.remove('view-exit')
    hide.style.display = 'none'
    show.style.display = 'block'
    // 重新触发入场动画
    show.classList.remove('view-enter')
    void show.offsetWidth
    show.classList.add('view-enter')
    if (afterShow) afterShow()
    viewLock = false
  }, 170)
}

// 常规课表 → 周选择
function showWeekSelect () {
  switchView('scheduleView', 'weekSelectView')
}
// 周选择 → 常规课表（第 w 周）
function selectWeek (w) {
  switchView('weekSelectView', 'scheduleView', () => renderSchedule(w, 0))
}

// ============================================================
// 6. 周切换（上一周 / 下一周，带动画）
// ============================================================
function changeWeek (delta) {
  const w = currentWeek + delta
  if (w < 1 || w > TOTAL_WEEKS || viewLock) return
  viewLock = true
  const table = document.getElementById('scheduleTable')
  const title = document.getElementById('weekTitle')
  // 周标题轻微弹跳
  title.classList.remove('pop')
  void title.offsetWidth
  title.classList.add('pop')
  // 旧表格滑出
  table.classList.add(delta > 0 ? 'anim-out-left' : 'anim-out-right')
  setTimeout(() => {
    renderSchedule(w, delta)
    table.classList.remove('anim-out-left', 'anim-out-right')
    void table.offsetWidth
    // 新表格从对应方向滑入
    table.classList.add(delta > 0 ? 'anim-in-right' : 'anim-in-left')
    setTimeout(() => {
      table.classList.remove('anim-in-right', 'anim-in-left')
      viewLock = false
    }, 460)
  }, 190)
}

// ============================================================
// 7. 节次时间工具
// ============================================================

// 取某节的整段时间字符串（如 "08:40~09:20"）
function getPeriodTime (secNum) {
  const p = PERIODS.find(p => p.num === secNum)
  return p ? `${p.start}~${p.end}` : ''
}

// 把 "HH:MM" 转成从 0:00 起的分钟数；兼容中文冒号"："和英文":"
function parseHM (s) {
  const [h, m] = s.replace('：', ':').split(':').map(Number)
  return h * 60 + m
}

// 根据系统当前时间判断正在上第几节课；不在任何一节课内返回 null
function getCurrentPeriodNum () {
  const now = new Date()
  const cur = now.getHours() * 60 + now.getMinutes()
  for (const p of PERIODS) {
    if (cur >= parseHM(p.start) && cur <= parseHM(p.end)) return p.num
  }
  return null
}
let currentPeriodNum = getCurrentPeriodNum()

// ============================================================
// 8. 课程详情弹窗
// ============================================================
function showModal (ev) {
  currentPeriodNum = getCurrentPeriodNum() // 每次操作都刷新当前时间
  const startTime = getPeriodTime(ev.startSec).split('~')[0]
  const endTime = getPeriodTime(ev.endSec).split('~')[1]
  document.getElementById('modalTitle').textContent = ev.summary
  const credit = ev.credit
  document.getElementById('modalInfo').innerHTML = `
    <p><strong>学分：</strong>${
      credit !== undefined ? credit + ' 学分' : '—'
    }</p>
    <p><strong>节次：</strong>第${ev.startSec} - ${ev.endSec}节</p>
    <p><strong>时间：</strong>${startTime}~${endTime}</p>
    <p><strong>教室：</strong>${ev.location || '待定'}</p>
    <p><strong>老师：</strong>${ev.teacher}</p>
    ${ev.note ? `<p><strong>备注：</strong>${ev.note}</p>` : ''}
  `
  // 顶部色条与课程块同色
  document.getElementById('modalBar').className =
    'modal-bar ' + getColor(ev.summary)
  const mask = document.getElementById('modalMask')
  mask.classList.remove('show', 'visible')
  void mask.offsetWidth
  mask.classList.add('show')
  // 下一帧再加 visible，保证 display 切换后过渡动画正常播放
  requestAnimationFrame(() => mask.classList.add('visible'))
}

function closeModal (e) {
  // 点弹窗内容区不关闭，只有点遮罩或关闭按钮才关
  if (e && e.target && e.target.id !== 'modalMask') return
  const mask = document.getElementById('modalMask')
  if (!mask.classList.contains('show')) return
  mask.classList.remove('visible')
  setTimeout(() => mask.classList.remove('show'), 250)
}

// 桌面端按 Esc 关闭弹窗
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal()
})

// ============================================================
// 9. 调休课表
// ============================================================

// "YYYY-MM-DD" → Date（本地时区）
function parseDate (s) {
  const [y, mo, d] = s.split('-').map(Number)
  return new Date(y, mo - 1, d)
}

// 取出所有未过期的调休安排（makeupDate >= 今天），按日期升序
function getUpcomingMakeups () {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return MAKEUP_CLASSES.map(m => ({
    ...m,
    orig: parseDate(m.originalDate),
    mk: parseDate(m.makeupDate)
  }))
    .filter(m => m.mk >= today)
    .sort((a, b) => a.mk - b.mk)
}

// 根据原日期，算出那天要上的所有课（按周几 + 周数区间）
function getEventsForOriginalDate (date) {
  const diff = Math.floor((date - SEMESTER_START) / (7 * 24 * 3600 * 1000))
  const weekNum = diff + 1
  const dow = date.getDay() // 0=周日
  const day = dow === 0 ? 7 : dow // 转成 1=周一 ... 7=周日
  return EVENTS.filter(
    ev => ev.day === day && weekNum >= ev.startWeek && weekNum <= ev.endWeek
  )
}

let currentMakeupIdx = 0

// 周选择 → 调休课表
function showMakeupView () {
  currentMakeupIdx = 0
  switchView('weekSelectView', 'makeupView', () => renderMakeup())
}
// 调休课表 → 周选择
function showWeekSelectFromMakeup () {
  switchView('makeupView', 'weekSelectView')
}
// 切换调休 tab
function selectMakeup (i) {
  currentMakeupIdx = i
  renderMakeup()
}

function renderMakeup () {
  currentPeriodNum = getCurrentPeriodNum() // 每次渲染都刷新当前时间
  const list = getUpcomingMakeups()
  const tabsEl = document.getElementById('makeupTabs')
  const emptyEl = document.getElementById('makeupEmpty')
  const scrollEl = document.getElementById('makeupScroll')

  // 没有未过期调休 → 显示空状态
  if (list.length === 0) {
    tabsEl.innerHTML = ''
    emptyEl.style.display = 'block'
    scrollEl.style.display = 'none'
    return
  }
  emptyEl.style.display = 'none'
  scrollEl.style.display = 'block'

  if (currentMakeupIdx >= list.length) currentMakeupIdx = 0

  // 顶部 tabs
  const weekNamesCN = ['日', '一', '二', '三', '四', '五', '六']
  let tabsHtml = ''
  list.forEach((m, i) => {
    const dateStr = `${m.mk.getMonth() + 1}/${m.mk.getDate()}`
    const dowStr = '周' + weekNamesCN[m.mk.getDay()]
    const note = m.note ? ` · ${m.note}` : ''
    tabsHtml += `<button class="makeup-tab ${
      i === currentMakeupIdx ? 'active' : ''
    }" onclick="selectMakeup(${i})">${dateStr} ${dowStr}${note}</button>`
  })
  tabsEl.innerHTML = tabsHtml

  // 表头
  const m = list[currentMakeupIdx]
  const headerHtml = `<th class="period-col">节次</th><th>周${
    weekNamesCN[m.mk.getDay()]
  }<br><span style="font-size:11px;font-weight:400;color:#94a3b8">${
    m.mk.getMonth() + 1
  }/${m.mk.getDate()}${m.note ? ' · ' + m.note : ''}</span></th>`
  document.getElementById('makeupHeader').innerHTML = headerHtml

  // 取原日期那天的课
  const dayEvents = getEventsForOriginalDate(m.orig)

  // cellMap 渲染（跟 renderSchedule 同样的 rowspan 逻辑）
  const cellMap = {}
  dayEvents.forEach(ev => {
    for (let s = ev.startSec; s <= ev.endSec; s++) cellMap[s] = ev
  })

  let bodyHtml = ''
  PERIODS.forEach((p, idx) => {
    bodyHtml += `<tr><td class="period-col${
      p.num === currentPeriodNum ? ' now-period' : ''
    }"><div class="period-label">第${p.num}节</div><div class="period-time">${
      p.start
    }~${p.end}</div></td>`
    const ev = cellMap[p.num]
    if (ev && ev.startSec === p.num) {
      const rowSpan = ev.endSec - ev.startSec + 1
      const credit = ev.credit
      bodyHtml += `<td class="course-cell" rowspan="${rowSpan}">
        <div class="course-block ${getColor(ev.summary)}" style="--i:${Math.min(
        idx,
        10
      )}" onclick='showModal(${JSON.stringify(ev).replace(/'/g, '&#39;')})'>
          <div class="course-name">${ev.summary}</div>
          ${
            credit !== undefined
              ? `<div class="course-credit">${ICONS.credit}${credit}学分</div>`
              : ''
          }
          ${
            ev.location
              ? `<div class="course-loc">${ICONS.pin}${ev.location}</div>`
              : ''
          }
          ${
            ev.teacher
              ? `<div class="course-teacher">${ICONS.teacher}${ev.teacher}</div>`
              : ''
          }
          ${ev.note ? `<div class="course-note">${ev.note}</div>` : ''}
        </div>
      </td>`
    } else if (!ev) {
      bodyHtml += `<td class="course-cell empty-cell"></td>`
    }
    bodyHtml += `</tr>`
  })
  document.getElementById('makeupBody').innerHTML = bodyHtml
}

// ============================================================
// 10. 手机端返回键拦截
// ============================================================
// 规则：
//   - 桌面端：不拦截，浏览器"上一页"默认行为正常
//   - 手机端：
//       * 在课表/调休页按返回 → 回到周选择页（不真的退出网页）
//       * 在周选择页按返回 → 第一次提示"再按一次退出"，第二次才真的关网页
// 实现原理：用 History API 往历史栈里 pushState 一个占位条目，
// 拦截 popstate 事件自己处理视图切换。

const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
let backPressedOnce = false // 周选择页第一次按返回的标记

// 底部轻提示
function showToast (text) {
  const t = document.getElementById('toast')
  t.textContent = text
  t.classList.add('show')
  clearTimeout(showToast._timer)
  showToast._timer = setTimeout(() => t.classList.remove('show'), 1800)
}

// 判断当前哪个视图可见
function getVisibleView () {
  if (document.getElementById('scheduleView').style.display !== 'none')
    return 'schedule'
  if (document.getElementById('makeupView').style.display !== 'none')
    return 'makeup'
  return 'weekSelect'
}

if (isMobile) {
  // 页面加载时先 push 一个根状态，让第一次按返回能触发 popstate
  history.pushState({ page: 'root' }, '')

  window.addEventListener('popstate', () => {
    const view = getVisibleView()

    if (view === 'schedule') {
      // 在常规课表 → 回周选择
      showWeekSelect()
      history.pushState({ page: 'root' }, '')
    } else if (view === 'makeup') {
      // 在调休课表 → 回周选择
      showWeekSelectFromMakeup()
      history.pushState({ page: 'root' }, '')
    } else {
      // 在周选择页：两次返回退出
      if (!backPressedOnce) {
        backPressedOnce = true
        showToast('再按一次返回键退出')
        history.pushState({ page: 'root' }, '')
        setTimeout(() => {
          backPressedOnce = false
        }, 2000)
      } else {
        // 第二次按返回：尝试关闭标签页
        window.close()
        // 兜底：部分浏览器禁止脚本关闭非脚本打开的标签页，延迟检测
        // 如果标签没关掉，就把历史回退到底（等效于退出）
        setTimeout(() => {
          if (!window.closed) {
            window.open('', '_self')
            window.close()
            // 再兜底：跳回上一页（用户感知为退出网页）
            history.go(-history.length)
          }
        }, 200)
      }
    }
  })
}

// ============================================================
// 11. 初始化
// ============================================================
renderWeekGrid()
// 首页入场动画
const weekSelect = document.getElementById('weekSelectView')
weekSelect.classList.add('view-enter')
// 默认先停在周选择页（不自动进入某一周）
