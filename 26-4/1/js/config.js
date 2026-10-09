// ============================================================
// 课程表总配置文件（由编辑器生成）
// ============================================================

const SEMESTER = {
  startDate: '2026-09-07',
  totalWeeks: 20
};

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
  { num: 11, start: '21:00', end: '21:40' },
];

const WEEK_TAGS = {
  18: '计算机组装实训',
  19: '网站设计实训',
};

const SHOW_DAYS = [1, 2, 3, 4, 5];

const COURSES = [
  {
    name: '综合英语', credit: 3, teacher: '潘晨云', note: '',
    sessions: [
      { day: 1, startSec: 5, endSec: 6, startWeek: 5, endWeek: 16, location: '8103D' },
      { day: 4, startSec: 7, endSec: 8, startWeek: 5, endWeek: 16, location: '8103D' },
    ],
  },
  {
    name: '体育（一）', credit: 1, teacher: '', note: '',
    sessions: [
      { day: 1, startSec: 7, endSec: 8, startWeek: 5, endWeek: 14, location: '' },
    ],
  },
  {
    name: '网页设计', credit: 3, teacher: '曾秋玲', note: '',
    sessions: [
      { day: 1, startSec: 3, endSec: 4, startWeek: 6, endWeek: 17, location: '7307J' },
      { day: 3, startSec: 1, endSec: 2, startWeek: 6, endWeek: 17, location: '7307J' },
    ],
  },
  {
    name: 'C语言程序设计', credit: 3, teacher: '廖江福', note: '',
    sessions: [
      { day: 1, startSec: 9, endSec: 11, startWeek: 6, endWeek: 13, location: 'A508J' },
      { day: 2, startSec: 9, endSec: 11, startWeek: 10, endWeek: 17, location: 'A201J' },
    ],
  },
  {
    name: '计算机导论', credit: 3, teacher: '涂志军', note: '',
    sessions: [
      { day: 2, startSec: 1, endSec: 2, startWeek: 6, endWeek: 17, location: 'A201J' },
      { day: 4, startSec: 1, endSec: 2, startWeek: 6, endWeek: 17, location: 'A201J' },
    ],
  },
  {
    name: '军事理论', credit: 2, teacher: '徐秋梦', note: '',
    sessions: [
      { day: 2, startSec: 3, endSec: 4, startWeek: 6, endWeek: 15, location: '8308D' },
    ],
  },
  {
    name: '应用高等数学B', credit: 4, teacher: '陈德健', note: '',
    sessions: [
      { day: 2, startSec: 7, endSec: 8, startWeek: 5, endWeek: 18, location: '8203D' },
      { day: 3, startSec: 3, endSec: 4, startWeek: 5, endWeek: 18, location: '8106D' },
      { day: 5, startSec: 3, endSec: 4, startWeek: 15, endWeek: 18, location: '8203D' },
    ],
  },
  {
    name: '思想道德与法治（一）', credit: 1.5, teacher: '李德先', note: '',
    sessions: [
      { day: 3, startSec: 5, endSec: 6, startWeek: 5, endWeek: 16, location: '8303D' },
    ],
  },
  {
    name: '形势与政策（一）', credit: 0.25, teacher: '李德先', note: '',
    sessions: [
      { day: 3, startSec: 5, endSec: 6, startWeek: 17, endWeek: 18, location: '8303D' },
    ],
  },
  {
    name: '创新创业基础与实践（一）', credit: 0.5, teacher: '潘显鹏', note: '',
    sessions: [
      { day: 3, startSec: 9, endSec: 10, startWeek: 6, endWeek: 9, location: '8108D' },
    ],
  },
  {
    name: '职业发展与就业指导（一）', credit: 0.5, teacher: '蒋彩梅', note: '',
    sessions: [
      { day: 3, startSec: 9, endSec: 10, startWeek: 10, endWeek: 13, location: '8206D' },
    ],
  },
  {
    name: '大学生心理健康教育（一）', credit: 1, teacher: '潘显鹏', note: '',
    sessions: [
      { day: 5, startSec: 3, endSec: 4, startWeek: 6, endWeek: 13, location: '8201D' },
    ],
  },
  {
    name: '计算机组装与维护实训', credit: 1, teacher: '涂志军、廖江福', note: '',
    sessions: [
      { day: 1, startSec: 1, endSec: 11, startWeek: 18, endWeek: 18, location: 'A409J' },
      { day: 2, startSec: 9, endSec: 11, startWeek: 18, endWeek: 18, location: 'A409J' },
      { day: 3, startSec: 9, endSec: 11, startWeek: 18, endWeek: 18, location: 'A409J' },
      { day: 4, startSec: 1, endSec: 4, startWeek: 18, endWeek: 18, location: 'A409J' },
      { day: 4, startSec: 9, endSec: 11, startWeek: 18, endWeek: 18, location: 'A409J' },
    ],
  },
  {
    name: '网站设计实训', credit: 1, teacher: '曾秋玲', note: '',
    sessions: [
      { day: 1, startSec: 1, endSec: 8, startWeek: 19, endWeek: 19, location: '7303J' },
      { day: 2, startSec: 1, endSec: 4, startWeek: 19, endWeek: 19, location: '7303J' },
      { day: 3, startSec: 1, endSec: 8, startWeek: 19, endWeek: 19, location: '7303J' },
      { day: 4, startSec: 9, endSec: 11, startWeek: 19, endWeek: 19, location: '7303J' },
    ],
  },
];

const MAKEUP_CLASSES = [
  { originalDate: '2026-10-07', makeupDate: '2026-10-10', note: '' },
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
