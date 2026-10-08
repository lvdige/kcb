// ===== 课程表数据 =====
// day: 1=周一, 2=周二, ... 7=周日
// startWeek / endWeek: 课程开课的周数区间（例：第3~5周上课 → startWeek:3, endWeek:5）
// 每行末尾注释为原日期区间（firstDate~lastDate），仅供追溯核对
const EVENTS = [
  { summary: "综合英语", day: 1, startSec: 5, endSec: 6, startWeek: 5, endWeek: 16, location: "8103D", teacher: "潘晨云" },  // 原 2026-10-05 ~ 2026-12-27
  { summary: "体育（一）", day: 1, startSec: 7, endSec: 8, startWeek: 5, endWeek: 14, location: "", teacher: "" },  // 原 2026-10-05 ~ 2026-12-13
  { summary: "网页设计", day: 1, startSec: 3, endSec: 4, startWeek: 6, endWeek: 17, location: "7307J", teacher: "曾秋玲" },  // 原 2026-10-12 ~ 2027-01-03
  { summary: "C语言程序设计", day: 1, startSec: 9, endSec: 11, startWeek: 6, endWeek: 13, location: "A508J", teacher: "廖江福" },  // 原 2026-10-12 ~ 2026-12-06
  { summary: "计算机导论", day: 2, startSec: 1, endSec: 2, startWeek: 6, endWeek: 17, location: "A201J", teacher: "涂志军" },  // 原 2026-10-13 ~ 2027-01-04
  { summary: "军事理论", day: 2, startSec: 3, endSec: 4, startWeek: 6, endWeek: 15, location: "8308D", teacher: "徐秋梦" },  // 原 2026-10-13 ~ 2026-12-21
  { summary: "应用高等数学B", day: 2, startSec: 7, endSec: 8, startWeek: 5, endWeek: 18, location: "8203D", teacher: "陈德健" },  // 原 2026-10-06 ~ 2027-01-11
  { summary: "C语言程序设计", day: 2, startSec: 9, endSec: 11, startWeek: 10, endWeek: 17, location: "A201J", teacher: "廖江福" },  // 原 2026-11-10 ~ 2027-01-04
  { summary: "网页设计", day: 3, startSec: 1, endSec: 2, startWeek: 6, endWeek: 17, location: "7307J", teacher: "曾秋玲" },  // 原 2026-10-14 ~ 2027-01-05
  { summary: "应用高等数学B", day: 3, startSec: 3, endSec: 4, startWeek: 5, endWeek: 18, location: "8106D", teacher: "陈德健" },  // 原 2026-10-07 ~ 2027-01-12
  { summary: "思想道德与法治（一）", day: 3, startSec: 5, endSec: 6, startWeek: 5, endWeek: 16, location: "8303D", teacher: "李德先" },  // 原 2026-10-07 ~ 2026-12-29
  { summary: "形势与政策（一）", day: 3, startSec: 5, endSec: 6, startWeek: 17, endWeek: 18, location: "8303D", teacher: "李德先" },  // 原 2026-12-30 ~ 2027-01-12
  { summary: "创新创业基础与实践（一）", day: 3, startSec: 9, endSec: 10, startWeek: 6, endWeek: 9, location: "8108D", teacher: "潘显鹏" },  // 原 2026-10-14 ~ 2026-11-10
  { summary: "职业发展与就业指导（一）", day: 3, startSec: 9, endSec: 10, startWeek: 10, endWeek: 13, location: "8206D", teacher: "蒋彩梅" },  // 原 2026-11-11 ~ 2026-12-08
  { summary: "计算机导论", day: 4, startSec: 1, endSec: 2, startWeek: 6, endWeek: 17, location: "A201J", teacher: "涂志军" },  // 原 2026-10-15 ~ 2027-01-06
  { summary: "综合英语", day: 4, startSec: 7, endSec: 8, startWeek: 5, endWeek: 16, location: "8103D", teacher: "潘晨云" },  // 原 2026-10-08 ~ 2026-12-30
  { summary: "大学生心理健康教育（一）", day: 5, startSec: 3, endSec: 4, startWeek: 6, endWeek: 13, location: "8201D", teacher: "潘显鹏" },  // 原 2026-10-16 ~ 2026-12-10
  { summary: "应用高等数学B", day: 5, startSec: 3, endSec: 4, startWeek: 15, endWeek: 18, location: "8203D", teacher: "陈德健" },  // 原 2026-12-18 ~ 2027-01-14
  { summary: "计算机组装与维护实训", day: 1, startSec: 1, endSec: 11, startWeek: 18, endWeek: 18, location: "A409J", teacher: "涂志军、廖江福" },  // 原 2027-01-04 ~ 2027-01-04
  { summary: "计算机组装与维护实训", day: 2, startSec: 9, endSec: 11, startWeek: 18, endWeek: 18, location: "A409J", teacher: "涂志军、廖江福" },  // 原 2027-01-05 ~ 2027-01-05
  { summary: "计算机组装与维护实训", day: 3, startSec: 9, endSec: 11, startWeek: 18, endWeek: 18, location: "A409J", teacher: "涂志军、廖江福" },  // 原 2027-01-06 ~ 2027-01-06
  { summary: "计算机组装与维护实训", day: 4, startSec: 1, endSec: 4, startWeek: 18, endWeek: 18, location: "A409J", teacher: "涂志军、廖江福" },  // 原 2027-01-07 ~ 2027-01-07
  { summary: "计算机组装与维护实训", day: 4, startSec: 9, endSec: 11, startWeek: 18, endWeek: 18, location: "A409J", teacher: "涂志军、廖江福" },  // 原 2027-01-07 ~ 2027-01-07
  { summary: "网站设计实训", day: 1, startSec: 1, endSec: 8, startWeek: 19, endWeek: 19, location: "7303J", teacher: "曾秋玲" },  // 原 2027-01-11 ~ 2027-01-11
  { summary: "网站设计实训", day: 2, startSec: 1, endSec: 4, startWeek: 19, endWeek: 19, location: "7303J", teacher: "曾秋玲" },  // 原 2027-01-12 ~ 2027-01-12
  { summary: "网站设计实训", day: 3, startSec: 1, endSec: 8, startWeek: 19, endWeek: 19, location: "7303J", teacher: "曾秋玲" },  // 原 2027-01-13 ~ 2027-01-13
  { summary: "网站设计实训", day: 4, startSec: 9, endSec: 11, startWeek: 19, endWeek: 19, location: "7303J", teacher: "曾秋玲" },  // 原 2027-01-14 ~ 2027-01-14
];