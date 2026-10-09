// ============================================================
// 课程表总配置文件
// ============================================================
// 所有可调参数都集中在这一个文件里，改课表不用动 main.js。
//
// 结构总览：
//   SEMESTER        学期开学日与总周数
//   PERIODS         每节课的节次与起止时间
//   WEEK_TAGS       特殊周（如实训周）在周选择页上的小标签
//   SHOW_DAYS       课表表头显示哪几天（1=周一 ... 7=周日）
//   COURSES         课程列表（一门课一个对象，多时段放 sessions）
//   MAKEUP_CLASSES  调休安排（原日期 → 调休日期）
// ============================================================

// ------------------------------------------------------------
// 1. 学期设置
// ------------------------------------------------------------
const SEMESTER = {
  // 开学日，必须是周一，格式 "YYYY-MM-DD"。
  // 例：2026-09-07 表示 2026 年 9 月 7 日开学。
  startDate: '2026-09-07',

  // 本学期一共多少周。
  // 例：20 表示从开学日起排 20 周，第 20 周之后视为放假。
  totalWeeks: 20
}

// ------------------------------------------------------------
// 2. 节次时间表
// ------------------------------------------------------------
// 每节课的节次编号、开始时间、结束时间。
// num   : 节次号（正整数，从 1 开始连续编号）
// start : 开始时间，格式 "HH:MM"（24小时制），中文冒号"："也能识别
// end   : 结束时间，格式 "HH:MM"（24小时制），中文冒号"："也能识别
//
// 想加第 12 节就在数组末尾再加一行；
// 想删某节就把对应行删掉；
// 时间改了直接改 start / end 即可。
// 系统会根据当前时间自动判断"现在正在上第几节课"，
// 并在课表首列把那一节高亮出来。
const PERIODS = [
  { num: 1, start: '08:40', end: '09:20' },
  { num: 2, start: '09:25', end: '10:05' },
  { num: 3, start: '10:25', end: '11:05' },
  { num: 4, start: '11:10', end: '11:50' },
  { num: 5, start: '14:30', end: '15:10' },
  { num: 6, start: '15:15', end: '15:55' },
  { num: 7, start: '16:05', end: '16:45' },
  { num: 8, start: '16:50', end: '17:30' },
  { num: 9, start: '19:30', end: '20:10' },
  { num: 10, start: '20:15', end: '20:55' },
  { num: 11, start: '21:00', end: '21:40' }
]

// ------------------------------------------------------------
// 3. 特殊周标签
// ------------------------------------------------------------
// 周选择页上，对应周数下方会显示一个小标签。
// key 是周数（数字），value 是标签文字。
// 例：18: "计算机组装实训" 表示第 18 周下面显示黄色小标签。
// 不需要的周直接删掉那一行。
const WEEK_TAGS = {
  18: '计算机组装实训',
  19: '网站设计实训'
}

// ------------------------------------------------------------
// 4. 课表显示哪几天
// ------------------------------------------------------------
// 控制常规课表表头显示哪几列。
// 数字含义：1=周一，2=周二，3=周三，4=周四，5=周五，6=周六，7=周日
//
// 例子：
//   [1,2,3,4,5]         只显示周一到周五（默认）
//   [1,2,3,4,5,6]       周一到周六都显示
//   [1,2,3,4,5,6,7]     一周七天都显示
//   [2,4]               只显示周二、周四（极端示例）
//
// 注意：COURSES 里某门课排在没显示的那天，这节课在常规课表里就看不到，
// 但仍然会算在调休/弹窗逻辑里，不影响数据。
const SHOW_DAYS = [1, 2, 3, 4, 5]

// ------------------------------------------------------------
// 5. 课程列表
// ------------------------------------------------------------
// 一门课一个对象：
//   name     课程名（弹窗和课程块上显示的文字）
//   credit   学分（数字，弹窗和课程块上显示）
//   teacher  老师姓名（字符串；不确定就写 ""）
//   note     备注（字符串；会显示在课程块最后一行和弹窗里，没有就写 ""）
//   sessions 排课段数组，每段一节课：
//       day        周几（1=周一 ... 7=周日）
//       startSec   开始节次（对应 PERIODS 里的 num）
//       endSec     结束节次（连续多节写大的那个，比如连排两节写 6）
//       startWeek  从第几周开始上
//       endWeek    上到第几周结束（闭区间）
//       location   教室（不确定写 ""）
//
// 加新课：在数组末尾再加一个 { name, credit, teacher, sessions: [...] }。
// 加新时段：在对应课的 sessions 里再 push 一行。
// 删课：整个对象删掉即可。
const COURSES = [
  {
    name: '综合英语',
    credit: 3,
    teacher: '潘晨云',
    sessions: [
      {
        day: 1,
        startSec: 5,
        endSec: 6,
        startWeek: 5,
        endWeek: 16,
        location: '8103D'
      },
      {
        day: 4,
        startSec: 7,
        endSec: 8,
        startWeek: 5,
        endWeek: 16,
        location: '8103D'
      }
    ]
  },
  {
    name: '体育（一）',
    credit: 1,
    teacher: '',
    note: '健身气功',
    sessions: [
      {
        day: 1,
        startSec: 7,
        endSec: 8,
        startWeek: 5,
        endWeek: 14,
        location: '学校田径场'
      }
    ]
  },
  {
    name: '网页设计',
    credit: 3,
    teacher: '曾秋玲',
    sessions: [
      {
        day: 1,
        startSec: 3,
        endSec: 4,
        startWeek: 6,
        endWeek: 17,
        location: '7307J'
      },
      {
        day: 3,
        startSec: 1,
        endSec: 2,
        startWeek: 6,
        endWeek: 17,
        location: '7307J'
      }
    ]
  },
  {
    name: 'C语言程序设计',
    credit: 3,
    teacher: '廖江福',
    sessions: [
      {
        day: 1,
        startSec: 9,
        endSec: 11,
        startWeek: 6,
        endWeek: 13,
        location: 'A508J'
      },
      {
        day: 2,
        startSec: 9,
        endSec: 11,
        startWeek: 10,
        endWeek: 17,
        location: 'A201J'
      }
    ]
  },
  {
    name: '计算机导论',
    credit: 3,
    teacher: '涂志军',
    sessions: [
      {
        day: 2,
        startSec: 1,
        endSec: 2,
        startWeek: 6,
        endWeek: 17,
        location: 'A201J'
      },
      {
        day: 4,
        startSec: 1,
        endSec: 2,
        startWeek: 6,
        endWeek: 17,
        location: 'A201J'
      }
    ]
  },
  {
    name: '军事理论',
    credit: 2,
    teacher: '徐秋梦',
    sessions: [
      {
        day: 2,
        startSec: 3,
        endSec: 4,
        startWeek: 6,
        endWeek: 15,
        location: '8308D'
      }
    ]
  },
  {
    name: '应用高等数学B',
    credit: 4,
    teacher: '陈德健',
    sessions: [
      {
        day: 2,
        startSec: 7,
        endSec: 8,
        startWeek: 5,
        endWeek: 18,
        location: '8203D'
      },
      {
        day: 3,
        startSec: 3,
        endSec: 4,
        startWeek: 5,
        endWeek: 18,
        location: '8106D'
      },
      {
        day: 5,
        startSec: 3,
        endSec: 4,
        startWeek: 15,
        endWeek: 18,
        location: '8203D'
      }
    ]
  },
  {
    name: '思想道德与法治（一）',
    credit: 1.5,
    teacher: '李德先',
    sessions: [
      {
        day: 3,
        startSec: 5,
        endSec: 6,
        startWeek: 5,
        endWeek: 16,
        location: '8303D'
      }
    ]
  },
  {
    name: '形势与政策（一）',
    credit: 0.25,
    teacher: '李德先',
    sessions: [
      {
        day: 3,
        startSec: 5,
        endSec: 6,
        startWeek: 17,
        endWeek: 18,
        location: '8303D'
      }
    ]
  },
  {
    name: '创新创业基础与实践（一）',
    credit: 0.5,
    teacher: '潘显鹏',
    sessions: [
      {
        day: 3,
        startSec: 9,
        endSec: 10,
        startWeek: 6,
        endWeek: 9,
        location: '8108D'
      }
    ]
  },
  {
    name: '职业发展与就业指导（一）',
    credit: 0.5,
    teacher: '蒋彩梅',
    sessions: [
      {
        day: 3,
        startSec: 9,
        endSec: 10,
        startWeek: 10,
        endWeek: 13,
        location: '8206D'
      }
    ]
  },
  {
    name: '大学生心理健康教育（一）',
    credit: 1,
    teacher: '潘显鹏',
    sessions: [
      {
        day: 5,
        startSec: 3,
        endSec: 4,
        startWeek: 6,
        endWeek: 13,
        location: '8201D'
      }
    ]
  },
  {
    name: '计算机组装与维护实训',
    credit: 1,
    teacher: '涂志军、廖江福',
    sessions: [
      {
        day: 1,
        startSec: 1,
        endSec: 11,
        startWeek: 18,
        endWeek: 18,
        location: 'A409J'
      },
      {
        day: 2,
        startSec: 9,
        endSec: 11,
        startWeek: 18,
        endWeek: 18,
        location: 'A409J'
      },
      {
        day: 3,
        startSec: 9,
        endSec: 11,
        startWeek: 18,
        endWeek: 18,
        location: 'A409J'
      },
      {
        day: 4,
        startSec: 1,
        endSec: 4,
        startWeek: 18,
        endWeek: 18,
        location: 'A409J'
      },
      {
        day: 4,
        startSec: 9,
        endSec: 11,
        startWeek: 18,
        endWeek: 18,
        location: 'A409J'
      }
    ]
  },
  {
    name: '网站设计实训',
    credit: 1,
    teacher: '曾秋玲',
    sessions: [
      {
        day: 1,
        startSec: 1,
        endSec: 8,
        startWeek: 19,
        endWeek: 19,
        location: '7303J'
      },
      {
        day: 2,
        startSec: 1,
        endSec: 4,
        startWeek: 19,
        endWeek: 19,
        location: '7303J'
      },
      {
        day: 3,
        startSec: 1,
        endSec: 8,
        startWeek: 19,
        endWeek: 19,
        location: '7303J'
      },
      {
        day: 4,
        startSec: 9,
        endSec: 11,
        startWeek: 19,
        endWeek: 19,
        location: '7303J'
      }
    ]
  }
]

// ------------------------------------------------------------
// 6. 调休安排
// ------------------------------------------------------------
// 法定节假日前后的"工作日放假、周末补课"登记。
// 每条一个对象：
//   originalDate  原本该上课、但被放掉的那天，格式 "YYYY-MM-DD"
//   makeupDate    实际补课的那天（通常是周末），格式 "YYYY-MM-DD"
//   note          备注文字，会显示在调休 tab 上，可省略
//
// 自动过期：makeupDate 早于今天的条目会自动隐藏，不用手动删历史记录。
// 课程内容会自动取 originalDate 那天（按周几）原本要上的所有课。
//
// 例子：
//   { originalDate: "2026-10-07", makeupDate: "2026-10-10", note: "国庆调休" },
const MAKEUP_CLASSES = [
  // { originalDate: "2026-10-07", makeupDate: "2026-10-10", note: "国庆调休" },
]

// ============================================================
// 以下为运行时兼容层：把上面结构化配置拍平成 main.js 用的旧格式
// （一般不需要改下面）
// ============================================================
const [_y, _m, _d] = SEMESTER.startDate.split('-').map(Number)
const SEMESTER_START = new Date(_y, _m - 1, _d)
const TOTAL_WEEKS = SEMESTER.totalWeeks

// 拍平课程：每个 session 一条事件
const EVENTS = []
COURSES.forEach(c => {
  c.sessions.forEach(s => {
    EVENTS.push({
      summary: c.name,
      credit: c.credit,
      teacher: c.teacher,
      note: c.note || '',
      day: s.day,
      startSec: s.startSec,
      endSec: s.endSec,
      startWeek: s.startWeek,
      endWeek: s.endWeek,
      location: s.location || ''
    })
  })
})
