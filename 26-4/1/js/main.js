// ===== 课程配色映射 =====
const COLOR_MAP = {};
const COLORS = ["c-blue", "c-green", "c-orange", "c-pink", "c-purple", "c-cyan", "c-red", "c-indigo", "c-teal", "c-amber"];
let colorIdx = 0;
function getColor(name) {
  if (!COLOR_MAP[name]) {
    COLOR_MAP[name] = COLORS[colorIdx % COLORS.length];
    colorIdx++;
  }
  return COLOR_MAP[name];
}

// ===== 工具函数 =====
function formatDate(d) {
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
function getWeekMonday(weekNum) {
  const d = new Date(SEMESTER_START);
  d.setDate(d.getDate() + (weekNum - 1) * 7);
  return d;
}
// 课程是否在第 weekNum 周上课：按周数区间判断
// （原实现按日期区间 firstDate~lastDate 判断，二者等价）
function eventInWeek(ev, weekNum) {
  return weekNum >= ev.startWeek && weekNum <= ev.endWeek;
}

// ===== 当前周计算 =====
function getCurrentWeek() {
  const now = new Date();
  const diff = Math.floor((now - SEMESTER_START) / (7 * 24 * 60 * 60 * 1000));
  let w = diff + 1;
  if (w < 1) w = 1;
  if (w > TOTAL_WEEKS) w = TOTAL_WEEKS;
  return w;
}

let currentWeek = 1;
// 动画锁：视图切换 / 周切换动画进行中时忽略新请求，避免快速点击导致动画打架
let viewLock = false;

// ===== 渲染周选择页 =====
function renderWeekGrid() {
  const grid = document.getElementById("weekGrid");
  const cur = getCurrentWeek();
  let html = "";
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const mon = getWeekMonday(w);
    const sun = new Date(mon);
    sun.setDate(sun.getDate() + 6);
    const isCur = w === cur;
    const tag = WEEK_TAGS[w] ? `<span class="week-tag">${WEEK_TAGS[w]}</span>` : "";
    html += `
      <div class="week-btn ${isCur ? 'current' : ''}" style="--i:${w - 1}" onclick="selectWeek(${w})">
        <div class="week-num">第 ${w} 周</div>
        <div class="week-date">${formatDate(mon)} - ${formatDate(sun)}</div>
        ${tag}
      </div>`;
  }
  grid.innerHTML = html;
}

// ===== 渲染课程表 =====
// dir：0 = 首次进入（课程块交错入场）；1 / -1 = 上一周 / 下一周切换（表格整体滑动）
function renderSchedule(weekNum, dir) {
  currentWeek = weekNum;
  const table = document.getElementById("scheduleTable");
  table.dataset.dir = String(dir || 0);
  const mon = getWeekMonday(weekNum);
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  document.getElementById("weekTitle").textContent = `第 ${weekNum} 周`;
  document.getElementById("prevWeek").disabled = weekNum <= 1;
  document.getElementById("nextWeek").disabled = weekNum >= TOTAL_WEEKS;

  // 表头
  const dayNames = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const today = new Date();
  let headerHtml = '<th class="period-col">节次</th>';
  for (let d = 0; d < 5; d++) {
    const dayDate = new Date(mon);
    dayDate.setDate(dayDate.getDate() + d);
    const isToday = today.toDateString() === dayDate.toDateString();
    headerHtml += `<th class="${isToday ? 'today' : ''}">${dayNames[d]}<br><span style="font-size:11px;font-weight:400;color:#94a3b8">${dayDate.getMonth() + 1}/${dayDate.getDate()}</span></th>`;
  }
  document.getElementById("dayHeader").innerHTML = headerHtml;

  // 构建课程查找表：key = day_sec, value = event
  const cellMap = {}; // {day_sec: ev}
  EVENTS.forEach(ev => {
    if (eventInWeek(ev, weekNum)) {
      for (let s = ev.startSec; s <= ev.endSec; s++) {
        cellMap[`${ev.day}_${s}`] = ev;
      }
    }
  });

  // 表体
  let bodyHtml = "";
  PERIODS.forEach((p, idx) => {
    bodyHtml += `<tr><td class="period-col"><div class="period-label">第${p.num}节</div><div class="period-time">${p.time}</div></td>`;
    for (let d = 1; d <= 5; d++) {
      const ev = cellMap[`${d}_${p.num}`];
      if (ev) {
        // 只在课程开始节次渲染block
        if (ev.startSec === p.num) {
          const rowSpan = ev.endSec - ev.startSec + 1;
          bodyHtml += `<td class="course-cell" rowspan="${rowSpan}">
            <div class="course-block ${getColor(ev.summary)}" style="--i:${Math.min(idx, 10)}" onclick='showModal(${JSON.stringify(ev).replace(/'/g, "&#39;")})'>
              <div class="course-name">${ev.summary}</div>
              ${ev.location ? `<div class="course-loc">📍 ${ev.location}</div>` : ''}
              ${ev.teacher ? `<div class="course-teacher">👨‍🏫 ${ev.teacher}</div>` : ''}
            </div>
          </td>`;
        }
        // 否则不输出td（被rowspan占了）
      } else {
        bodyHtml += `<td class="course-cell empty-cell"></td>`;
      }
    }
    bodyHtml += `</tr>`;
  });
  document.getElementById("scheduleBody").innerHTML = bodyHtml;
}

// ===== 视图切换（带动画） =====
function switchView(hideId, showId, afterShow) {
  if (viewLock) return;
  viewLock = true;
  const hide = document.getElementById(hideId);
  const show = document.getElementById(showId);
  hide.classList.add("view-exit");
  setTimeout(() => {
    hide.classList.remove("view-exit");
    hide.style.display = "none";
    show.style.display = "block";
    // 重新触发入场动画
    show.classList.remove("view-enter");
    void show.offsetWidth;
    show.classList.add("view-enter");
    if (afterShow) afterShow();
    viewLock = false;
  }, 170);
}
function showWeekSelect() {
  switchView("scheduleView", "weekSelectView");
}
function selectWeek(w) {
  switchView("weekSelectView", "scheduleView", () => renderSchedule(w, 0));
}

// ===== 周切换（带动画） =====
function changeWeek(delta) {
  const w = currentWeek + delta;
  if (w < 1 || w > TOTAL_WEEKS || viewLock) return;
  viewLock = true;
  const table = document.getElementById("scheduleTable");
  const title = document.getElementById("weekTitle");
  // 周标题轻微弹跳
  title.classList.remove("pop");
  void title.offsetWidth;
  title.classList.add("pop");
  // 旧表格滑出
  table.classList.add(delta > 0 ? "anim-out-left" : "anim-out-right");
  setTimeout(() => {
    renderSchedule(w, delta);
    table.classList.remove("anim-out-left", "anim-out-right");
    void table.offsetWidth;
    // 新表格从对应方向滑入
    table.classList.add(delta > 0 ? "anim-in-right" : "anim-in-left");
    setTimeout(() => {
      table.classList.remove("anim-in-right", "anim-in-left");
      viewLock = false;
    }, 460);
  }, 190);
}

// ===== 弹窗（带动画） =====
// 根据节次号取该节时间字符串（如 "08:40~9:20"）
function getPeriodTime(secNum) {
  const p = PERIODS.find(p => p.num === secNum);
  return p ? p.time : "";
}
function showModal(ev) {
  // 起止时间：取开始节次的开始时间 ~ 结束节次的结束时间
  const startTime = getPeriodTime(ev.startSec).split("~")[0];
  const endTime = getPeriodTime(ev.endSec).split("~")[1];
  document.getElementById("modalTitle").textContent = ev.summary;
  document.getElementById("modalInfo").innerHTML = `
    <p><strong>时间：</strong>${startTime}~${endTime}</p>
    <p><strong>节次：</strong>第${ev.startSec} - ${ev.endSec}节</p>
    <p><strong>教室：</strong>${ev.location || "待定"}</p>
    <p><strong>老师：</strong>${ev.teacher}</p>
  `;
  // 顶部色条与课程块同色
  document.getElementById("modalBar").className = "modal-bar " + getColor(ev.summary);
  const mask = document.getElementById("modalMask");
  mask.classList.remove("show", "visible");
  void mask.offsetWidth;
  mask.classList.add("show");
  // 下一帧再加 visible，保证 display 切换后过渡动画正常播放
  requestAnimationFrame(() => mask.classList.add("visible"));
}
function closeModal(e) {
  // 点击弹窗内容区不关闭，只有点遮罩或关闭按钮才关
  if (e && e.target && e.target.id !== "modalMask") return;
  const mask = document.getElementById("modalMask");
  if (!mask.classList.contains("show")) return;
  mask.classList.remove("visible");
  setTimeout(() => mask.classList.remove("show"), 250);
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// ===== 初始化 =====
renderWeekGrid();
// 首页入场动画
const weekSelect = document.getElementById("weekSelectView");
weekSelect.classList.add("view-enter");
// 默认定位到当前周
// selectWeek(getCurrentWeek()); // 默认先显示周选择页
