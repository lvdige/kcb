// ===== 课表配置编辑器 =====

let cfg = {
  site: { title: "", heroTitle: "", startYear: new Date().getFullYear(), term: "第一学期", extra: "" },
  semester: { startDate: new Date().toISOString().slice(0,10), totalWeeks: 20 },
  periods: [],
  showDays: [1,2,3,4,5,6,7],
  weekTags: {},
  courses: [],
  makeup: [],
};

const DAY_OPTIONS = [1,2,3,4,5,6,7];
const DAY_NAMES = ["","周一","周二","周三","周四","周五","周六","周日"];

// ---------- 智能解析：日期 ----------
// 支持：2026-09-07 / 2026-9-7 / 2026.09.07 / 2026/9/7 / 2026年9月7日 / 20260907 / 202697 / Date 对象
function parseDateSmart(v) {
  if (v == null || v === "") return "";
  if (v instanceof Date && !isNaN(v)) {
    return v.getFullYear() + "-" + String(v.getMonth()+1).padStart(2,"0") + "-" + String(v.getDate()).padStart(2,"0");
  }
  // Excel 序列号数字（1900 起）
  if (typeof v === "number" && isFinite(v) && v > 30000 && v < 60000) {
    const d = new Date(Date.UTC(1899,11,30) + v*86400000);
    return d.getUTCFullYear() + "-" + String(d.getUTCMonth()+1).padStart(2,"0") + "-" + String(d.getUTCDate()).padStart(2,"0");
  }
  let s = String(v).trim();
  // 去掉中文"年月日"，把 . / 年 月 日 统一成分隔
  s = s.replace(/[年月]/g, "-").replace(/[日。]/g, "").replace(/[./]/g, "-");
  // 连续数字 8 位：20260907
  let m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // 连续数字 6 位：202697（年4+月1+日1）—— 少见，跳过
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;
  return s; // 兜底原样
}

// ---------- 智能解析：时间 ----------
// 支持：8:40 / 08:40 / 8：40 / 08：40 / 8:40:00 / 8点40分 / 8时40分 / 上午8:40
function parseTimeSmart(v) {
  if (v == null || v === "") return "";
  let s = String(v).trim();
  // 中文冒号换英文
  s = s.replace(/：/g, ":");
  // 8点40分 / 8时40分 → 8:40
  s = s.replace(/([0-9]{1,2})\s*[点时]\s*([0-9]{1,2})\s*分?/, "$1:$2");
  // 去掉秒和上午下午
  s = s.replace(/上午|下午|AM|PM/g, "").trim();
  const m = s.match(/(\d{1,2}):(\d{1,2})(?::\d{1,2})?/);
  if (m) return `${m[1].padStart(2,"0")}:${m[2].padStart(2,"0")}`;
  return s;
}

// ---------- 智能解析：数字 ----------
function num(v) {
  if (v == null || v === "") return 0;
  const n = parseFloat(String(v).replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function updateSubtitlePreview() {
  document.getElementById("subtitlePreview").textContent = buildSubtitle();
}

// ---------- 渲染 ----------
// 拼副标题：2026–2027 学年第一学期 · 2026年9月7日开学 · 大一上
function buildSubtitle() {
  const year = +document.getElementById("siteStartYear").value || new Date().getFullYear();
  const term = document.getElementById("siteTerm").value;
  const extra = document.getElementById("siteExtra").value.trim();
  const sd = document.getElementById("startDate").value;
  let datePart = "";
  if (sd) {
    const [y,m,d] = sd.split("-").map(Number);
    datePart = `${y}年${m}月${d}日开学`;
  }
  return `${year}–${year+1} 学年${term}${datePart ? " · " + datePart : ""}${extra ? " · " + extra : ""}`;
}

function render() {
  document.getElementById("startDate").value = cfg.semester.startDate;
  document.getElementById("totalWeeks").value = cfg.semester.totalWeeks;
  document.getElementById("siteTitle").value = cfg.site.title || "";
  document.getElementById("siteHeroTitle").value = cfg.site.heroTitle || "";
  document.getElementById("siteStartYear").value = cfg.site.startYear || new Date().getFullYear();
  document.getElementById("siteTerm").value = cfg.site.term || "第一学期";
  document.getElementById("siteExtra").value = cfg.site.extra || "";
  updateSubtitlePreview();

  // 节次
  const pb = document.getElementById("periodsBox");
  pb.innerHTML = "";
  cfg.periods.forEach((p,i) => {
    pb.insertAdjacentHTML("beforeend", `
      <div class="row-line">
        <span style="font-size:12px;color:#64748b;width:40px">第${p.num}节</span>
        <input type="time" value="${p.start}" onchange="cfg.periods[${i}].start=this.value">
        <span>~</span>
        <input type="time" value="${p.end}" onchange="cfg.periods[${i}].end=this.value">
        <button class="btn-del" onclick="cfg.periods.splice(${i},1);renumberPeriods();render()">删</button>
      </div>`);
  });

  // SHOW_DAYS
  const sb = document.getElementById("showDaysBox");
  sb.innerHTML = "";
  DAY_OPTIONS.forEach(d => {
    const checked = cfg.showDays.includes(d) ? "checked" : "";
    sb.insertAdjacentHTML("beforeend",
      `<label><input type="checkbox" ${checked} onchange="toggleDay(${d},this.checked)">${DAY_NAMES[d]}</label>`);
  });

  // WEEK_TAGS
  const wtb = document.getElementById("weekTagsBox");
  wtb.innerHTML = "";
  Object.entries(cfg.weekTags).forEach(([w,t],i) => {
    wtb.insertAdjacentHTML("beforeend", `
      <div class="row-line">
        <input type="number" value="${w}" onchange="renameWeekTag(${i},this.value)">
        <input value="${t}" onchange="cfg.weekTags[${JSON.stringify(w)}]=this.value">
        <button class="btn-del" onclick="delWeekTag(${i})">删</button>
      </div>`);
  });

  // 课程（表格行）
  const cb = document.getElementById("coursesBox");
  cb.innerHTML = "";
  cfg.courses.forEach((c,i) => {
    let sessionsHtml = `<div class="session-cell">`;
    c.sessions.forEach((s,j) => {
      sessionsHtml += `
        <div class="session-line">
          <select onchange="cfg.courses[${i}].sessions[${j}].day=+this.value">${DAY_OPTIONS.map(d=>`<option value="${d}" ${s.day===d?'selected':''}>${DAY_NAMES[d]}</option>`).join('')}</select>
          <span class="lbl">节</span>
          <input type="number" value="${s.startSec}" title="开始节次" onchange="cfg.courses[${i}].sessions[${j}].startSec=+this.value">~
          <input type="number" value="${s.endSec}" title="结束节次" onchange="cfg.courses[${i}].sessions[${j}].endSec=+this.value">
          <span class="lbl">周</span>
          <input type="number" value="${s.startWeek}" title="开始周" onchange="cfg.courses[${i}].sessions[${j}].startWeek=+this.value">~
          <input type="number" value="${s.endWeek}" title="结束周" onchange="cfg.courses[${i}].sessions[${j}].endWeek=+this.value">
          <input placeholder="教室" value="${s.location}" onchange="cfg.courses[${i}].sessions[${j}].location=this.value">
          <button class="btn-del" onclick="cfg.courses[${i}].sessions.splice(${j},1);render()">删</button>
        </div>`;
    });
    sessionsHtml += `<button class="btn-add" style="margin-top:4px;padding:4px 10px;font-size:11px" onclick="cfg.courses[${i}].sessions.push({day:1,startSec:1,endSec:2,startWeek:1,endWeek:16,location:''});render()">+ 时段</button>`;
    sessionsHtml += `</div>`;

    cb.insertAdjacentHTML("beforeend", `
      <tr>
        <td class="col-name"><input value="${c.name}" onchange="cfg.courses[${i}].name=this.value"></td>
        <td class="col-num"><input type="number" step="0.25" value="${c.credit}" onchange="cfg.courses[${i}].credit=parseFloat(this.value)"></td>
        <td class="col-teacher"><input value="${c.teacher}" onchange="cfg.courses[${i}].teacher=this.value"></td>
        <td class="col-note"><input value="${c.note||''}" onchange="cfg.courses[${i}].note=this.value"></td>
        <td>${sessionsHtml}</td>
        <td><button class="btn-del" onclick="cfg.courses.splice(${i},1);render()">删课</button></td>
      </tr>`);
  });
  document.getElementById("courseCount").textContent = cfg.courses.length;

  // 调休
  const mb = document.getElementById("makeupBox");
  mb.innerHTML = "";
  cfg.makeup.forEach((m,i) => {
    mb.insertAdjacentHTML("beforeend", `
      <div class="row-line">
        <input type="date" value="${m.originalDate}" onchange="cfg.makeup[${i}].originalDate=this.value">
        <span style="font-size:11px;color:#94a3b8">调至</span>
        <input type="date" value="${m.makeupDate}" onchange="cfg.makeup[${i}].makeupDate=this.value">
        <input placeholder="备注" value="${m.note||''}" onchange="cfg.makeup[${i}].note=this.value">
        <button class="btn-del" onclick="cfg.makeup.splice(${i},1);render()">删</button>
      </div>`);
  });

  updateOutput();
}

function renumberPeriods() { cfg.periods.forEach((p,i)=>p.num=i+1); }
function addPeriod() {
  let start = "08:00";
  if (cfg.periods.length > 0) {
    const last = cfg.periods[cfg.periods.length - 1].end;
    const [h, m] = last.split(":").map(Number);
    const t = new Date(2000,0,1,h,m+10);
    start = String(t.getHours()).padStart(2,"0") + ":" + String(t.getMinutes()).padStart(2,"0");
  }
  const [sh, sm] = start.split(":").map(Number);
  const end = String(sh).padStart(2,"0") + ":" + String(sm+40).padStart(2,"0");
  cfg.periods.push({num:cfg.periods.length+1, start, end});
  render();
}
function toggleDay(d, on) {
  if (on && !cfg.showDays.includes(d)) cfg.showDays.push(d).sort((a,b)=>a-b);
  if (!on) cfg.showDays = cfg.showDays.filter(x=>x!==d);
}
function addWeekTag() { cfg.weekTags[1] = "新标签"; render(); }
function renameWeekTag(i, newW) {
  const keys = Object.keys(cfg.weekTags);
  const v = cfg.weekTags[keys[i]];
  delete cfg.weekTags[keys[i]];
  cfg.weekTags[newW] = v; render();
}
function delWeekTag(i) { delete cfg.weekTags[Object.keys(cfg.weekTags)[i]]; render(); }
function addCourse() { cfg.courses.push({name:"新课", credit:1, teacher:"", note:"", sessions:[{day:1,startSec:1,endSec:2,startWeek:1,endWeek:16,location:""}]}); render(); }
function addMakeup() {
  const today = new Date();
  const tmr = new Date(Date.now() + 86400000);
  const fmt = d => d.toISOString().slice(0,10);
  cfg.makeup.push({originalDate: fmt(today), makeupDate: fmt(tmr), note:""});
  render();
}

// ---------- 导出 config.js ----------
function q(s) { return "'" + String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'") + "'"; }
function genConfig() {
  cfg.semester.startDate = document.getElementById("startDate").value;
  cfg.semester.totalWeeks = +document.getElementById("totalWeeks").value;
  cfg.site.title = document.getElementById("siteTitle").value;
  cfg.site.heroTitle = document.getElementById("siteHeroTitle").value;
  cfg.site.startYear = +document.getElementById("siteStartYear").value;
  cfg.site.term = document.getElementById("siteTerm").value;
  cfg.site.extra = document.getElementById("siteExtra").value;
  const sub = buildSubtitle();

  return `// ============================================================
// 课程表总配置文件（由编辑器生成）
// ============================================================

const SITE = {
  title: ${q(cfg.site.title)},
  heroTitle: ${q(cfg.site.heroTitle)},
  heroSubtitle: ${q(sub)}
};

const SEMESTER = {
  startDate: ${q(cfg.semester.startDate)},
  totalWeeks: ${cfg.semester.totalWeeks}
};

const PERIODS = [
${cfg.periods.map(p=>`  { num: ${p.num}, start: ${q(p.start)}, end: ${q(p.end)} },`).join("\n")}
];

const WEEK_TAGS = {
${Object.entries(cfg.weekTags).map(([w,t])=>`  ${w}: ${q(t)},`).join("\n")}
};

const SHOW_DAYS = [${cfg.showDays.join(", ")}];

const COURSES = [
${cfg.courses.map(c=>`  {
    name: ${q(c.name)}, credit: ${c.credit}, teacher: ${q(c.teacher)}, note: ${q(c.note||'')},
    sessions: [
${c.sessions.map(s=>`      { day: ${s.day}, startSec: ${s.startSec}, endSec: ${s.endSec}, startWeek: ${s.startWeek}, endWeek: ${s.endWeek}, location: ${q(s.location||'')} },`).join("\n")}
    ],
  },`).join("\n")}
];

const MAKEUP_CLASSES = [
${cfg.makeup.map(m=>`  { originalDate: ${q(m.originalDate)}, makeupDate: ${q(m.makeupDate)}, note: ${q(m.note||'')} },`).join("\n")}
];

// ===== 运行时拍平（不要改）=====
const [_y,_m,_d] = SEMESTER.startDate.split("-").map(Number);
const SEMESTER_START = new Date(_y,_m-1,_d);
const TOTAL_WEEKS = SEMESTER.totalWeeks;
const EVENTS = [];
COURSES.forEach(c=>c.sessions.forEach(s=>EVENTS.push({
  summary:c.name, credit:c.credit, teacher:c.teacher, note:c.note||'',
  day:s.day, startSec:s.startSec, endSec:s.endSec, startWeek:s.startWeek, endWeek:s.endWeek,
  location:s.location||''
})));
`;
}
function updateOutput() { document.getElementById("output").value = genConfig(); }
function exportConfig() {
  const blob = new Blob([genConfig()], {type:"text/javascript"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "config.js";
  a.click();
  showToast("已下载 config.js");
}
function copyConfig() {
  navigator.clipboard.writeText(genConfig()).then(()=>showToast("已复制，粘贴到 js/config.js 覆盖即可"));
}

// ---------- Excel 导出 ----------
// 工具：构造带顶部说明的 sheet
// desc: 说明文字；example: 例子文字；headers: 表头数组；dataRows: 数据二维数组
function buildSheet(desc, example, headers, dataRows) {
  const ncol = headers.length;
  const aoa = [
    [desc],                              // 第1行 说明（合并）
    [example],                           // 第2行 例子（合并）
    [],                                  // 第3行 空
    headers,                             // 第4行 表头
    ...dataRows,                         // 第5行起 数据
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!merges"] = [
    { s: {r:0,c:0}, e: {r:0,c:ncol-1} },   // 说明行合并
    { s: {r:1,c:0}, e: {r:1,c:ncol-1} },   // 例子行合并
  ];
  // 说明行加粗
  if (ws["A1"]) { ws["A1"].s = { font: { bold: true, color: { rgb: "FF1E40AF" } } }; }
  return ws;
}

function exportExcel() {
  cfg.semester.startDate = document.getElementById("startDate").value;
  cfg.semester.totalWeeks = +document.getElementById("totalWeeks").value;

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, buildSheet(
    "【学期设置】第一部分是网站标题：浏览器标签标题、页面大标题填班级名；起始年份填开学年（自动拼 2026–2027 学年）；学期选第一/第二；补充文字自己写（如大一上）；开学日支持 2026-09-07 / 2026.9.7 / 2026年9月7日 / 20260907；显示日用逗号分隔",
    "例：浏览器标签标题=计应26-4班课程表，起始年份=2026，学期=第一学期，补充文字=大一上，开学日=2026-09-07，总周数=20，显示日=1,2,3,4,5",
    ["配置项", "值"],
    [["浏览器标签标题", cfg.site.title||""],
     ["页面大标题", cfg.site.heroTitle||""],
     ["起始年份", cfg.site.startYear||new Date().getFullYear()],
     ["学期", cfg.site.term||"第一学期"],
     ["补充文字", cfg.site.extra||""],
     ["开学日", cfg.semester.startDate],
     ["总周数", cfg.semester.totalWeeks],
     ["显示日(逗号分隔)", cfg.showDays.join(",")]],
  ), "学期设置");

  XLSX.utils.book_append_sheet(wb, buildSheet(
    "【节次时间】每节课的开始/结束时间。开始/结束列支持 8:40 / 08:40 / 8：40 / 8点40分 多种写法。节次号必须从1开始连续",
    "例：第1节 08:40 ~ 09:20；第2节 09:25 ~ 10:05",
    ["节次号", "开始", "结束"],
    cfg.periods.map(p => [p.num, p.start, p.end])
  ), "节次时间");

  XLSX.utils.book_append_sheet(wb, buildSheet(
    "【周标签】特殊周在周选择页显示的小标签，如实训周。周数=第几周，标签=显示文字",
    "例：周数=18，标签=计算机组装实训",
    ["周数", "标签"],
    Object.entries(cfg.weekTags).map(([w,t]) => [+w, t])
  ), "周标签");

  const courseRows = [["课程名","学分","老师","备注","周几","开始节","结束节","开始周","结束周","教室"]];
  cfg.courses.forEach(c => c.sessions.forEach(s => {
    courseRows.push([c.name, c.credit, c.teacher, c.note||"", s.day, s.startSec, s.endSec, s.startWeek, s.endWeek, s.location||""]);
  }));
  XLSX.utils.book_append_sheet(wb, buildSheet(
    "【课程】每门课每个时段一行。课程名相同的行会自动合并成一门课。周几：1=周一 ... 7=周日。开始/结束节=节次号。开始/结束周=从第几周到第几周",
    "例：综合英语 3学分 潘晨云 周一 第5~6节 第5~16周 8103D；同一门课有多个时段就写多行",
    courseRows[0],
    courseRows.slice(1)
  ), "课程");

  XLSX.utils.book_append_sheet(wb, buildSheet(
    "【调休安排】原日期→调休日期。系统自动隐藏已过期的调休。日期写法同学期设置。例：国庆调休，把10月7日(周三)的课调到10月10日(周六)上",
    "例：原日期=2026-10-07，调休日期=2026-10-10，备注=国庆调休",
    ["原日期","调休日期","备注"],
    cfg.makeup.map(m => [m.originalDate, m.makeupDate, m.note||""])
  ), "调休");

  XLSX.writeFile(wb, "课表配置.xlsx");
  showToast("已导出 Excel");
}

// 导出空白模板（只有说明和一行示例）
function exportTemplate() {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, buildSheet(
    "【学期设置】第一部分是网站标题：浏览器标签标题、页面大标题填班级名；起始年份填开学年（自动拼 2026–2027 学年）；学期选第一/第二；补充文字自己写（如大一上）；开学日支持 2026-09-07 / 2026.9.7 / 2026年9月7日 / 20260907；显示日用逗号分隔",
    "例：浏览器标签标题=计应26-4班课程表，起始年份=2026，学期=第一学期，补充文字=大一上，开学日=2026-09-07，总周数=20，显示日=1,2,3,4,5",
    ["配置项", "值"],
    [["浏览器标签标题","计应26-4班课程表"],
     ["页面大标题","计应26-4班课程表"],
     ["起始年份",2026],
     ["学期","第一学期"],
     ["补充文字","大一上"],
     ["开学日","2026-09-07"],["总周数",20],["显示日(逗号分隔)","1,2,3,4,5"]],
  ), "学期设置");

  XLSX.utils.book_append_sheet(wb, buildSheet(
    "【节次时间】每节课的开始/结束时间。开始/结束列支持 8:40 / 08:40 / 8：40 / 8点40分 多种写法。节次号必须从1开始连续",
    "例：第1节 08:40 ~ 09:20；第2节 09:25 ~ 10:05",
    ["节次号", "开始", "结束"],
    [[1,"08:40","09:20"],[2,"09:25","10:05"]]
  ), "节次时间");

  XLSX.utils.book_append_sheet(wb, buildSheet(
    "【周标签】特殊周在周选择页显示的小标签。周数=第几周，标签=显示文字。不需要就留空",
    "例：周数=18，标签=计算机组装实训",
    ["周数", "标签"],
    [[18,"计算机组装实训"]]
  ), "周标签");

  XLSX.utils.book_append_sheet(wb, buildSheet(
    "【课程】每门课每个时段一行。课程名相同的行会自动合并成一门课。周几：1=周一 ... 7=周日。开始/结束节=节次号。开始/结束周=从第几周到第几周",
    "例：综合英语 3学分 潘晨云 周一 第5~6节 第5~16周 8103D；同一门课有多个时段就写多行",
    ["课程名","学分","老师","备注","周几","开始节","结束节","开始周","结束周","教室"],
    [["综合英语",3,"潘晨云","",1,5,6,5,16,"8103D"],["综合英语",3,"潘晨云","",4,7,8,5,16,"8103D"]]
  ), "课程");

  XLSX.utils.book_append_sheet(wb, buildSheet(
    "【调休安排】原日期→调休日期。系统自动隐藏已过期的调休。日期写法同学期设置",
    "例：原日期=2026-10-07，调休日期=2026-10-10，备注=国庆调休",
    ["原日期","调休日期","备注"],
    [["2026-10-07","2026-10-10","国庆调休"]]
  ), "调休");

  XLSX.writeFile(wb, "课表配置_空白模板.xlsx");
  showToast("已导出空白模板");
}

// ---------- Excel 导入 ----------
function importExcel(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(e.target.result, { type: "array", cellDates: true });

      // 学期
      const semSheet = wb.Sheets["学期设置"];
      if (semSheet) {
        const rows = XLSX.utils.sheet_to_json(semSheet, { header: 1 }).slice(4); // 跳过说明+例子+空+表头
        rows.forEach(r => {
          if (r[0] === "浏览器标签标题") cfg.site.title = String(r[1]||"");
          if (r[0] === "页面大标题") cfg.site.heroTitle = String(r[1]||"");
          if (r[0] === "起始年份") cfg.site.startYear = num(r[1]);
          if (r[0] === "学期") cfg.site.term = String(r[1]);
          if (r[0] === "补充文字") cfg.site.extra = String(r[1]||"");
          if (r[0] === "开学日") cfg.semester.startDate = parseDateSmart(r[1]);
          if (r[0] === "总周数") cfg.semester.totalWeeks = num(r[1]);
          if (r[0] === "显示日(逗号分隔)") cfg.showDays = String(r[1]).split(/[,，、\s]+/).map(Number).filter(Boolean);
        });
      }

      // 节次
      const pSheet = wb.Sheets["节次时间"];
      if (pSheet) {
        const rows = XLSX.utils.sheet_to_json(pSheet, { header: 1 }).slice(4);
        cfg.periods = rows.filter(r=>r[0]!=null && r[0]!=="").map(r => ({ num:num(r[0]), start:parseTimeSmart(r[1]), end:parseTimeSmart(r[2]) }));
      }

      // 周标签
      const wtSheet = wb.Sheets["周标签"];
      if (wtSheet) {
        cfg.weekTags = {};
        XLSX.utils.sheet_to_json(wtSheet, { header: 1 }).slice(4).forEach(r => {
          if (r[0]!=null && r[0]!=="") cfg.weekTags[num(r[0])] = String(r[1]);
        });
      }

      // 课程（按课程名聚合）
      const cSheet = wb.Sheets["课程"];
      if (cSheet) {
        const rows = XLSX.utils.sheet_to_json(cSheet, { header: 1 }).slice(4);
        const map = {};
        rows.forEach(r => {
          if (!r[0] || r[0] === "") return;
          const name = String(r[0]);
          if (!map[name]) map[name] = { name, credit:num(r[1]), teacher:String(r[2]||""), note:String(r[3]||""), sessions:[] };
          map[name].sessions.push({ day:num(r[4]), startSec:num(r[5]), endSec:num(r[6]), startWeek:num(r[7]), endWeek:num(r[8]), location:String(r[9]||"") });
        });
        cfg.courses = Object.values(map);
      }

      // 调休
      const mSheet = wb.Sheets["调休"];
      if (mSheet) {
        cfg.makeup = XLSX.utils.sheet_to_json(mSheet, { header: 1 }).slice(4)
          .filter(r=>r[0] && r[0]!=="").map(r => ({ originalDate:parseDateSmart(r[0]), makeupDate:parseDateSmart(r[1]), note:String(r[2]||"") }));
      }

      render();
      showToast("导入成功");
    } catch (err) {
      alert("导入失败：" + err.message);
    }
    input.value = "";
  };
  reader.readAsArrayBuffer(file);
}

// ---------- 导入 config.js ----------
function importConfigJs(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const code = e.target.result;
      const factory = new Function(code + `; return { SITE, SEMESTER, PERIODS, SHOW_DAYS, WEEK_TAGS, COURSES, MAKEUP_CLASSES };`);
      const d = factory();
      cfg.site.title = d.SITE?.title || "";
      cfg.site.heroTitle = d.SITE?.heroTitle || "";
      // 从旧的 heroSubtitle 反推 startYear/term/extra
      const sub = d.SITE?.heroSubtitle || "";
      const m = sub.match(/(\d{4})–(\d{4})\s*学年(第[一二]学期)[\s·]*(\d{4})年(\d{1,2})月(\d{1,2})日开学[\s·]*(.*)/);
      if (m) {
        cfg.site.startYear = +m[1];
        cfg.site.term = m[3];
        cfg.site.extra = m[7] || "";
      } else {
        cfg.site.startYear = new Date().getFullYear();
        cfg.site.term = "第一学期";
        cfg.site.extra = sub;
      }
      cfg.semester.startDate = d.SEMESTER.startDate;
      cfg.semester.totalWeeks = d.SEMESTER.totalWeeks;
      cfg.periods = d.PERIODS;
      cfg.showDays = d.SHOW_DAYS;
      cfg.weekTags = d.WEEK_TAGS;
      cfg.courses = d.COURSES;
      cfg.makeup = d.MAKEUP_CLASSES || [];
      render();
      showToast("config.js 导入成功");
    } catch (err) {
      alert("导入失败：" + err.message);
    }
    input.value = "";
  };
  reader.readAsText(file);
}

// ---------- 导出精美课表 Excel（每周一个 sheet，用 ExcelJS 写样式）----------
async function exportPrettyTimetable() {
  cfg.semester.startDate = document.getElementById("startDate").value;
  cfg.semester.totalWeeks = +document.getElementById("totalWeeks").value;
  if (!cfg.semester.startDate) { alert("请先填开学日"); return; }

  const wb = new ExcelJS.Workbook();
  wb.creator = "课表编辑器";
  const colorList = [
    "FFDBEAFE","FFD1FAE5","FFFEF3C7","FFFCE7F3","FFE9D5FF","FFFEE2E2",
    "FFCFFAFE","FFFFEDD5","FFE0E7FF","FFF5F5F4","FFDCFCE7","FFFFE4E6",
    "FFE0F2FE","FFFEF9C3","FFFCE7F3","FFE0E7FF","FFD1FAE5","FFFFEDD5",
    "FFE9D5FF","FFFEE2E2"
  ];
  const colorMap = {};
  let ci = 0;
  const colorFor = name => colorMap[name] || (colorMap[name] = colorList[ci++ % colorList.length]);

  const [y,mo,da] = cfg.semester.startDate.split("-").map(Number);
  const start = new Date(y, mo-1, da);
  const nDay = 7;  // 固定周一~周日全列，不管 SHOW_DAYS
  const nPeriod = cfg.periods.length;
  const thinBorder = { style:"thin", color:{ argb:"FF94A3B8" } };
  const allBorder = { top:thinBorder, left:thinBorder, bottom:thinBorder, right:thinBorder };

  // 工具：日期对象转 "YYYY-MM-DD"
  const iso = d => d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
  // 某天是周几（1=周一 ... 7=周日）
  const dow = d => d.getDay() === 0 ? 7 : d.getDay();

  // 调休映射：makeupDate -> [originalDate]，同时收集所有 originalDate（放假日）
  const makeupMap = {};
  const holidayDates = new Set();
  cfg.makeup.forEach(m => {
    if (!makeupMap[m.makeupDate]) makeupMap[m.makeupDate] = [];
    makeupMap[m.makeupDate].push(m.originalDate);
    holidayDates.add(m.originalDate);
  });

  for (let w = 1; w <= cfg.semester.totalWeeks; w++) {
    const monday = new Date(start.getTime() + (w-1)*7*86400000);
    const sunday = new Date(monday.getTime() + 6*86400000);
    const fmt = d => `${d.getMonth()+1}/${d.getDate()}`;
    const label = cfg.weekTags[w] ? `（${cfg.weekTags[w]}）` : "";

    const ws = wb.addWorksheet(`第${w}周`, { views:[{showGridLines:false}] });

    // 列宽：A节次 B时间 C~周日
    ws.getColumn(1).width = 9;
    ws.getColumn(2).width = 14;
    for (let d = 1; d <= nDay; d++) ws.getColumn(2+d).width = 20;

    // 第1行 标题
    ws.mergeCells(1, 1, 1, 2+nDay);
    const t = ws.getCell(1,1);
    t.value = `第 ${w} 周课表  ${fmt(monday)} ~ ${fmt(sunday)} ${label}`;
    t.font = { name:"Microsoft YaHei", size:16, bold:true, color:{ argb:"FF1E40AF" } };
    t.alignment = { horizontal:"center", vertical:"middle" };
    ws.getRow(1).height = 40;

    // 第3行 表头
    ws.getRow(3).height = 26;
    const headers = ["节次","时间"];
    for (let d = 1; d <= nDay; d++) headers.push(DAY_NAMES[d]);
    headers.forEach((h, c) => {
      const cell = ws.getCell(3, c+1);
      cell.value = h;
      cell.font = { name:"Microsoft YaHei", size:11, bold:true, color:{ argb:"FFFFFFFF" } };
      cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF3B82F6" } };
      cell.alignment = { horizontal:"center", vertical:"middle" };
      cell.border = allBorder;
    });

    // 第4行起 每节
    cfg.periods.forEach((p, idx) => {
      const r = 4 + idx;
      ws.getRow(r).height = 56;
      const c1 = ws.getCell(r,1); c1.value = `第${p.num}节`;
      c1.font = { name:"Microsoft YaHei", size:10, bold:true, color:{argb:"FF475569"} };
      c1.alignment = { horizontal:"center", vertical:"middle" };
      c1.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFF1F5F9" } };
      c1.border = allBorder;
      const c2 = ws.getCell(r,2); c2.value = `${p.start}-${p.end}`;
      c2.font = { name:"Microsoft YaHei", size:10, color:{argb:"FF64748B"} };
      c2.alignment = { horizontal:"center", vertical:"middle" };
      c2.border = allBorder;
      for (let d = 1; d <= nDay; d++) {
        const cell = ws.getCell(r, 2+d);
        cell.border = allBorder;
        cell.alignment = { horizontal:"center", vertical:"middle", wrapText:true };
      }
    });

    // 填课程
    for (let pIdx = 0; pIdx < nPeriod; pIdx++) {
      const p = cfg.periods[pIdx];
      for (let d = 1; d <= nDay; d++) {
        for (const c of cfg.courses) {
          for (const s of c.sessions) {
            if (s.day === d && w >= s.startWeek && w <= s.endWeek && p.num === s.startSec) {
              // 找到开始节，合并 startSec~endSec
              const startRow = 3 + s.startSec;
              const endRow = 3 + s.endSec;
              const col = 2 + d;
              if (endRow > startRow) ws.mergeCells(startRow, col, endRow, col);
              const cell = ws.getCell(startRow, col);
              cell.value = `${c.name}\n${c.credit}学分 · ${c.teacher||""}\n📍${s.location||""}`;
              cell.font = { name:"Microsoft YaHei", size:10, color:{argb:"FF1E293B"} };
              cell.alignment = { horizontal:"center", vertical:"middle", wrapText:true };
              cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb: colorFor(c.name) } };
              cell.border = allBorder;
            }
          }
        }
      }
    }

    // 填调休补课：本周某天是 makeupDate，把 originalDate 那天的课画到这列
    for (let d = 1; d <= 7; d++) {
      const thatDate = new Date(monday.getTime() + (d-1)*86400000);
      const dateStr = iso(thatDate);
      if (makeupMap[dateStr]) {
        for (const origDate of makeupMap[dateStr]) {
          const origD = new Date(origDate);
          const origDow = dow(origD);
          for (const c of cfg.courses) {
            for (const s of c.sessions) {
              if (s.day !== origDow) continue;
              const origWeek = Math.round((origD - start) / (7*86400000)) + 1;
              if (origWeek < s.startWeek || origWeek > s.endWeek) continue;
              const startRow = 3 + s.startSec;
              const endRow = 3 + s.endSec;
              const col = 2 + d;
              if (endRow > startRow) ws.mergeCells(startRow, col, endRow, col);
              const cell = ws.getCell(startRow, col);
              cell.value = `[调休补课·原${origDate}]\n${c.name}\n${c.credit}学分 · ${c.teacher||""}\n📍${s.location||""}`;
              cell.font = { name:"Microsoft YaHei", size:10, color:{argb:"FF9A3412"}, bold:true };
              cell.alignment = { horizontal:"center", vertical:"middle", wrapText:true };
              cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFFED7AA" } };
              cell.border = allBorder;
            }
          }
        }
      }
    }
  }

  // ===== 单独 sheet：调休安排 =====
  if (cfg.makeup.length > 0) {
    const ws = wb.addWorksheet("调休安排", { views:[{showGridLines:false}] });
    ws.columns = [{width:16},{width:16},{width:24},{width:30}];
    ws.mergeCells("A1:D1");
    const t = ws.getCell("A1");
    t.value = "调休安排";
    t.font = { name:"Microsoft YaHei", size:16, bold:true, color:{argb:"FF1E40AF"} };
    t.alignment = { horizontal:"center", vertical:"middle" };
    ws.getRow(1).height = 36;
    ["原日期","调休日期","星期","备注"].forEach((h,i) => {
      const c = ws.getCell(2, i+1);
      c.value = h;
      c.font = { name:"Microsoft YaHei", size:11, bold:true, color:{argb:"FFFFFFFF"} };
      c.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FF3B82F6"} };
      c.alignment = { horizontal:"center", vertical:"middle" };
      c.border = allBorder;
    });
    cfg.makeup.forEach((m, i) => {
      const r = 3 + i;
      ws.getRow(r).height = 24;
      const od = new Date(m.originalDate), md = new Date(m.makeupDate);
      [m.originalDate, m.makeupDate, `原${DAY_NAMES[dow(od)]} → 调${DAY_NAMES[dow(md)]}`, m.note||""].forEach((v, j) => {
        const c = ws.getCell(r, j+1);
        c.value = v;
        c.font = { name:"Microsoft YaHei", size:11 };
        c.alignment = { horizontal:"center", vertical:"middle" };
        c.border = allBorder;
      });
    });
  }

  // ===== 调休课表 sheet：每个调休日一份完整课表 =====
  cfg.makeup.forEach((m, mi) => {
    if (!m.makeupDate) return;
    const md = new Date(m.makeupDate);
    const od = new Date(m.originalDate);
    const mdDow = dow(md);
    const odDow = dow(od);
    const mdWeek = Math.round((md - start) / (7*86400000)) + 1;
    const odWeek = Math.round((od - start) / (7*86400000)) + 1;

    const ws = wb.addWorksheet(`调休课表_${m.makeupDate.slice(5).replace("-","")}`, { views:[{showGridLines:false}] });
    ws.getColumn(1).width = 9;
    ws.getColumn(2).width = 13;
    ws.getColumn(3).width = 40;

    ws.mergeCells("A1:C1");
    const t = ws.getCell("A1");
    t.value = `调休课表 ${m.makeupDate}（${DAY_NAMES[mdDow]}）—— 补 ${m.originalDate}（${DAY_NAMES[odDow]}）的课`;
    t.font = { name:"Microsoft YaHei", size:14, bold:true, color:{argb:"FF9A3412"} };
    t.alignment = { horizontal:"center", vertical:"middle" };
    ws.getRow(1).height = 36;

    ["节次","时间","课程"].forEach((h,i) => {
      const c = ws.getCell(3, i+1);
      c.value = h;
      c.font = { name:"Microsoft YaHei", size:11, bold:true, color:{argb:"FFFFFFFF"} };
      c.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FFF97316"} };
      c.alignment = { horizontal:"center", vertical:"middle" };
      c.border = allBorder;
    });

    cfg.periods.forEach((p, idx) => {
      const r = 4 + idx;
      ws.getRow(r).height = 44;
      ws.getCell(r,1).value = `第${p.num}节`;
      ws.getCell(r,2).value = `${p.start}-${p.end}`;
      ws.getCell(r,1).font = { name:"Microsoft YaHei", size:10, bold:true };
      ws.getCell(r,2).font = { name:"Microsoft YaHei", size:10 };
      ws.getCell(r,1).fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FFF1F5F9"} };
      ws.getCell(r,1).alignment = ws.getCell(r,2).alignment = { horizontal:"center", vertical:"middle" };
      ws.getCell(r,1).border = ws.getCell(r,2).border = allBorder;
      ws.getCell(r,3).border = allBorder;
      ws.getCell(r,3).alignment = { horizontal:"left", vertical:"middle", wrapText:true };
    });

    // 填课：那天原本就有的课（基于 mdDow 和 mdWeek）
    for (const c of cfg.courses) {
      for (const s of c.sessions) {
        if (s.day === mdDow && mdWeek >= s.startWeek && mdWeek <= s.endWeek) {
          const startRow = 3 + s.startSec, endRow = 3 + s.endSec;
          if (endRow > startRow) ws.mergeCells(startRow, 3, endRow, 3);
          const cell = ws.getCell(startRow, 3);
          cell.value = `${c.name}（正常课）\n${c.credit}学分 · ${c.teacher||""}\n📍${s.location||""}`;
          cell.font = { name:"Microsoft YaHei", size:10, color:{argb:"FF1E293B"} };
          cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb: colorFor(c.name) } };
          cell.alignment = { horizontal:"center", vertical:"middle", wrapText:true };
        }
        // 原日期平移过来的课
        if (s.day === odDow && odWeek >= s.startWeek && odWeek <= s.endWeek) {
          const startRow = 3 + s.startSec, endRow = 3 + s.endSec;
          // 如果该格已有内容，追加
          const cell = ws.getCell(startRow, 3);
          const prefix = (cell.value ? cell.value + "\n---\n" : "");
          if (endRow > startRow && !cell.value) ws.mergeCells(startRow, 3, endRow, 3);
          cell.value = prefix + `[调休补课] ${c.name}\n${c.credit}学分 · ${c.teacher||""}\n📍${s.location||""}`;
          cell.font = { name:"Microsoft YaHei", size:10, color:{argb:"FF9A3412"}, bold:true };
          cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFFED7AA" } };
          cell.alignment = { horizontal:"center", vertical:"middle", wrapText:true };
        }
      }
    }
  });

  // ===== 横向超长总表：每个日期一列 =====
  {
    const ws = wb.addWorksheet("总表(横向)", { views:[{showGridLines:false}] });
    const totalDays = cfg.semester.totalWeeks * 7;
    ws.getColumn(1).width = 9;
    ws.getColumn(2).width = 13;
    for (let i = 0; i < totalDays; i++) ws.getColumn(3+i).width = 16;

    ws.mergeCells(1, 1, 1, 2+totalDays);
    const t = ws.getCell(1,1);
    t.value = `全学期总课表（${cfg.semester.startDate} 起 ${cfg.semester.totalWeeks} 周，共 ${totalDays} 天）`;
    t.font = { name:"Microsoft YaHei", size:14, bold:true, color:{argb:"FF1E40AF"} };
    t.alignment = { horizontal:"center", vertical:"middle" };
    ws.getRow(1).height = 32;

    ws.getRow(3).height = 40;
    ["节次","时间"].forEach((h,c) => {
      const cell = ws.getCell(3, c+1);
      cell.value = h;
      cell.font = { name:"Microsoft YaHei", size:11, bold:true, color:{argb:"FFFFFFFF"} };
      cell.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FF3B82F6"} };
      cell.alignment = { horizontal:"center", vertical:"middle" };
      cell.border = allBorder;
    });
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start.getTime() + i*86400000);
      const isWeekend = dow(d) >= 6;
      const cell = ws.getCell(3, 3+i);
      cell.value = `${d.getMonth()+1}/${d.getDate()}\n${DAY_NAMES[dow(d)]}`;
      cell.font = { name:"Microsoft YaHei", size:10, bold:true, color:{ argb: isWeekend ? "FFDC2626" : "FF1E293B" } };
      cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb: isWeekend ? "FFFEE2E2" : "FFFFFFFF" } };
      cell.alignment = { horizontal:"center", vertical:"middle", wrapText:true };
      cell.border = allBorder;
    }

    cfg.periods.forEach((p, idx) => {
      const r = 4 + idx;
      ws.getRow(r).height = 50;
      const c1 = ws.getCell(r,1); c1.value = `第${p.num}节`;
      c1.font = { name:"Microsoft YaHei", size:10, bold:true };
      c1.alignment = { horizontal:"center", vertical:"middle" };
      c1.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FFF1F5F9"} };
      c1.border = allBorder;
      const c2 = ws.getCell(r,2); c2.value = `${p.start}-${p.end}`;
      c2.font = { name:"Microsoft YaHei", size:10 };
      c2.alignment = { horizontal:"center", vertical:"middle" };
      c2.border = allBorder;
      for (let i = 0; i < totalDays; i++) {
        const cell = ws.getCell(r, 3+i);
        cell.border = allBorder;
        cell.alignment = { horizontal:"center", vertical:"middle", wrapText:true };
      }
    });

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start.getTime() + i*86400000);
      const w = Math.floor(i / 7) + 1;
      const day = dow(d);
      for (const c of cfg.courses) {
        for (const s of c.sessions) {
          if (s.day === day && w >= s.startWeek && w <= s.endWeek) {
            const startRow = 3 + s.startSec;
            const endRow = 3 + s.endSec;
            const col = 3 + i;
            if (endRow > startRow) ws.mergeCells(startRow, col, endRow, col);
            const cell = ws.getCell(startRow, col);
            cell.value = `${c.name}\n${c.teacher||""}\n📍${s.location||""}`;
            cell.font = { name:"Microsoft YaHei", size:9, color:{argb:"FF1E293B"} };
            cell.alignment = { horizontal:"center", vertical:"middle", wrapText:true };
            cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb: colorFor(c.name) } };
            cell.border = allBorder;
          }
        }
      }
      const dateStr = iso(d);
      if (makeupMap[dateStr]) {
        for (const origDate of makeupMap[dateStr]) {
          const origD = new Date(origDate);
          const origDow = dow(origD);
          const origWeek = Math.round((origD - start) / (7*86400000)) + 1;
          for (const c of cfg.courses) {
            for (const s of c.sessions) {
              if (s.day !== origDow) continue;
              if (origWeek < s.startWeek || origWeek > s.endWeek) continue;
              const startRow = 3 + s.startSec;
              const endRow = 3 + s.endSec;
              const col = 3 + i;
              if (endRow > startRow) ws.mergeCells(startRow, col, endRow, col);
              const cell = ws.getCell(startRow, col);
              cell.value = `[调休]\n${c.name}`;
              cell.font = { name:"Microsoft YaHei", size:9, bold:true, color:{argb:"FF9A3412"} };
              cell.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FFFED7AA"} };
              cell.alignment = { horizontal:"center", vertical:"middle", wrapText:true };
              cell.border = allBorder;
            }
          }
        }
      }
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (cfg.site.title || "精美课表") + ".xlsx";
  a.click();
  showToast("已导出精美课表");
}

// ---------- Toast ----------
function showToast(t) {
  const el = document.getElementById("toast");
  el.textContent = t;
  el.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>el.classList.remove("show"), 2000);
}

document.getElementById("startDate").addEventListener("input", () => { updateSubtitlePreview(); updateOutput(); });
document.getElementById("totalWeeks").addEventListener("input", updateOutput);
["siteTitle","siteHeroTitle","siteStartYear","siteTerm","siteExtra"].forEach(id =>
  document.getElementById(id).addEventListener("input", () => { updateSubtitlePreview(); updateOutput(); })
);

render();
