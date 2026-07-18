export const CATEGORIES = [
  "交通費",
  "接待交際費",
  "会議費",
  "消耗品費",
  "通信費",
  "旅費宿泊費",
  "諸会費",
  "雑費",
] as const;

export type Category = (typeof CATEGORIES)[number];
