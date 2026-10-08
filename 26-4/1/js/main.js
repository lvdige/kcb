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
      <div class="week-btn ${isCur ? 'current' : ''}" onclick="selectWeek(${w})">
        <div class="week-num">第 ${w} 周</div>
        <div class="week-date">${formatDate(mon)} - ${formatDate(sun)}</div>
        ${tag}
      </div>`;
  }
  grid.innerHTML = html;
}

// ===== 渲染课程表 =====
function renderSchedule(weekNum) {
  currentWeek = weekNum;
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
  PERIODS.forEach(p => {
    bodyHtml += `<tr><td class="period-col"><div class="period-label">第${p.num}节</div><div class="period-time">${p.time}</div></td>`;
    for (let d = 1; d <= 5; d++) {
      const ev = cellMap[`${d}_${p.num}`];
      if (ev) {
        // 只在课程开始节次渲染block
        if (ev.startSec === p.num) {
          const rowSpan = ev.endSec - ev.startSec + 1;
          bodyHtml += `<td class="course-cell" rowspan="${rowSpan}">
            <div class="course-block ${getColor(ev.summary)}" onclick='showModal(${JSON.stringify(ev).replace(/'/g, "&#39;")})'>
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

// ===== 视图切换 =====
function showWeekSelect() {
  document.getElementById("weekSelectView").style.display = "block";
  document.getElementById("scheduleView").style.display = "none";
}
function selectWeek(w) {
  document.getElementById("weekSelectView").style.display = "none";
  document.getElementById("scheduleView").style.display = "block";
  renderSchedule(w);
}
function changeWeek(delta) {
  const w = currentWeek + delta;
  if (w >= 1 && w <= TOTAL_WEEKS) renderSchedule(w);
}

// ===== 弹窗 =====
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
  document.getElementById("modalMask").classList.add("show");
}
function closeModal(e) {
  if (e && e.target.id !== "modalMask" && e.type === "click" && e.currentTarget.id !== "modalMask") {
    // 点击modal内部不关闭
  }
  document.getElementById("modalMask").classList.remove("show");
}

// ===== 初始化 =====
renderWeekGrid();
// 默认定位到当前周
// selectWeek(getCurrentWeek()); // 默认先显示周选择页
