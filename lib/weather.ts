export type WeatherKind = "sunny" | "cloudy" | "rainy" | "snow";
export type WeatherPattern = "single" | "sometimes" | "then";
export type DayMode = "today" | "tomorrow";

export type StoryWeather = {
  day: DayMode;
  dateLabel: string;
  weatherText: string;
  iconKey?: string;
  primary: WeatherKind;
  secondary?: WeatherKind;
  pattern: WeatherPattern;
  maxTemp: number;
  minTemp: number;
  amPop: number;
  pmPop: number;
  comment: string;
  backgroundIndex: number;
};

export const weatherOptions: Array<{
  text: string;
  iconKey?: string;
  primary: WeatherKind;
  secondary?: WeatherKind;
  pattern: WeatherPattern;
}> = [
  { text: "晴れ", iconKey: "sunny", primary: "sunny", pattern: "single" },
  { text: "くもり", iconKey: "cloudy", primary: "cloudy", pattern: "single" },
  { text: "雨", iconKey: "rainy", primary: "rainy", pattern: "single" },
  { text: "大雨", iconKey: "heavy_rainy", primary: "rainy", pattern: "single" },
  { text: "雪", iconKey: "snow", primary: "snow", pattern: "single" },
  { text: "雷", iconKey: "thunder", primary: "cloudy", pattern: "single" },
  { text: "雷雨", iconKey: "thunder_rainy", primary: "rainy", pattern: "single" },
  { text: "雨雪", iconKey: "rainy_snow", primary: "snow", secondary: "rainy", pattern: "sometimes" },
  { text: "くもり時々雨", iconKey: "cloudy_rainy", primary: "cloudy", secondary: "rainy", pattern: "sometimes" },
  { text: "雨時々くもり", iconKey: "rainy_cloudy", primary: "rainy", secondary: "cloudy", pattern: "sometimes" },
  { text: "晴れ時々くもり", iconKey: "sunny_cloudy", primary: "sunny", secondary: "cloudy", pattern: "sometimes" },
  { text: "くもり時々晴れ", iconKey: "cloudy_sunny", primary: "cloudy", secondary: "sunny", pattern: "sometimes" },
  { text: "晴れ時々雨", iconKey: "sunny_rainy", primary: "sunny", secondary: "rainy", pattern: "sometimes" },
  { text: "雨時々晴れ", iconKey: "rainy_sunny", primary: "rainy", secondary: "sunny", pattern: "sometimes" },
  { text: "晴れ時々雪", iconKey: "sunny_snow", primary: "sunny", secondary: "snow", pattern: "sometimes" },
  { text: "雪時々晴れ", iconKey: "snow_sunny", primary: "snow", secondary: "sunny", pattern: "sometimes" },
  { text: "くもり時々雪", iconKey: "cloudy_snow", primary: "cloudy", secondary: "snow", pattern: "sometimes" },
  { text: "雪時々くもり", iconKey: "snow_cloudy", primary: "snow", secondary: "cloudy", pattern: "sometimes" },
  { text: "雨時々雪", iconKey: "rainy_snow_alt", primary: "rainy", secondary: "snow", pattern: "sometimes" },
  { text: "雪時々雨", iconKey: "snow_rainy", primary: "snow", secondary: "rainy", pattern: "sometimes" },
  { text: "くもりのち晴れ", iconKey: "cloudy_then_sunny", primary: "cloudy", secondary: "sunny", pattern: "then" },
  { text: "晴れのちくもり", iconKey: "sunny_then_cloudy", primary: "sunny", secondary: "cloudy", pattern: "then" },
  { text: "雨のちくもり", iconKey: "rainy_then_cloudy", primary: "rainy", secondary: "cloudy", pattern: "then" },
  { text: "くもりのち雨", iconKey: "cloudy_then_rainy", primary: "cloudy", secondary: "rainy", pattern: "then" },
  { text: "雨のち晴れ", iconKey: "rainy_then_sunny", primary: "rainy", secondary: "sunny", pattern: "then" },
  { text: "晴れのち雨", iconKey: "sunny_then_rainy", primary: "sunny", secondary: "rainy", pattern: "then" },
  { text: "雪のちくもり", iconKey: "snow_then_cloudy", primary: "snow", secondary: "cloudy", pattern: "then" },
  { text: "くもりのち雪", iconKey: "cloudy_then_snow", primary: "cloudy", secondary: "snow", pattern: "then" },
  { text: "雪のち晴れ", iconKey: "snow_then_sunny", primary: "snow", secondary: "sunny", pattern: "then" },
  { text: "晴れのち雪", iconKey: "sunny_then_snow", primary: "sunny", secondary: "snow", pattern: "then" },
  { text: "雪のち雨", iconKey: "snow_then_rainy", primary: "snow", secondary: "rainy", pattern: "then" },
  { text: "雨のち雪", iconKey: "rainy_then_snow", primary: "rainy", secondary: "snow", pattern: "then" }
];

export const fallbackComments: Record<WeatherKind, string[]> = {
  sunny: [
    "おひさまがうれしい朝です。",
    "今日はいい日になりそう。",
    "青空に誘われて、ちょっとおでかけ。",
    "深呼吸したくなる一日。",
    "外の空気が気持ちよさそう。",
    "おさんぽしたくなる空。",
    "光がきれいな朝です。",
    "今日は軽やかにいこう。",
    "ごきげんな空模様。",
    "太陽に背中を押される日。",
    "なんだかいい予感。",
    "いつもより少し遠くまで。",
    "おでかけ日和になりそうです。",
    "空を見上げたくなる日。",
    "今日もよい一日を。",
    "思いきり遊べそう。",
    "朝から気持ちのいい空。",
    "小さな楽しみを見つけたい日。",
    "おひさまに会える一日。",
    "よい一日を♡"
  ],
  cloudy: [
    "今日はゆっくりいこう。",
    "のんびり過ごしたい空模様。",
    "無理せず、いつものペースで。",
    "穏やかな一日になりますように。",
    "ほっとひと息つきながら。",
    "なんでもない日を大切に。",
    "今日もぼちぼち。",
    "やさしい空の色です。",
    "落ち着いた一日になりそう。",
    "焦らず、のんびり。",
    "少し静かな朝です。",
    "自分のペースでいこう。",
    "なんだか落ち着く空。",
    "ゆっくり深呼吸。",
    "小さな幸せを見つけたい日。",
    "今日はやわらかく過ごそう。",
    "おうち時間も楽しめそう。",
    "空は曇っていても、気持ちは軽く。",
    "あたたかい飲み物が似合う日。",
    "穏やかに過ごせますように。"
  ],
  rainy: [
    "本日も傘をお忘れなく。",
    "雨の日も、いい一日を。",
    "足元にお気をつけて。",
    "今日はゆるやかに。",
    "雨音を楽しむ一日に。",
    "無理せず、のんびりと。",
    "少し早めの行動がおすすめです。",
    "お気に入りの傘で出発。",
    "しっとりした空気の一日。",
    "おうち時間も楽しめそう。",
    "雨宿りしながら、ひと休み。",
    "温かくしてお過ごしください。",
    "濡れないようお気をつけて。",
    "焦らず、安全第一で。",
    "雨の日ならではの楽しみを。",
    "今日はまったり過ごしたい日。",
    "コーヒーがおいしい空模様。",
    "雨の音に癒される朝。",
    "いつもより少しゆっくりと。",
    "今日も無理せずいきましょう。"
  ],
  snow: [
    "あたたかくしてお過ごしください。",
    "足元にお気をつけて。",
    "雪景色がきれいな朝です。",
    "防寒をしっかりしてお出かけを。",
    "あたたかい飲み物が恋しい日。",
    "ゆっくり安全にいきましょう。",
    "冬らしい一日になりそう。",
    "ぬくぬく過ごしたい日。",
    "手袋をお忘れなく。",
    "からだを冷やさないように。",
    "白い景色を楽しみながら。",
    "のんびりいきましょう。",
    "あたたかい一日になりますように。",
    "雪の朝は少し早めの行動を。",
    "冬の空気が気持ちいい日。",
    "おうち時間も楽しめそう。",
    "温かいものがおいしい季節。",
    "今日はあたたかさを大切に。",
    "やさしい冬の一日を。",
    "すべらないようお気をつけて。"
  ]
};

export function getWeatherOption(text: string) {
  return weatherOptions.find((option) => option.text === text) ?? weatherOptions[0];
}

export function formatDateLabel(date = new Date()) {
  const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return `${date.getMonth() + 1}.${date.getDate()} ${weekdays[date.getDay()]}`;
}

export function classifyWeather(code: number, precipitationSum = 0): Pick<StoryWeather, "weatherText" | "primary" | "secondary" | "pattern"> {
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { weatherText: "雪", primary: "snow", pattern: "single" };
  }
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) {
    return precipitationSum > 2
      ? { weatherText: "雨", primary: "rainy", pattern: "single" }
      : { weatherText: "くもり時々雨", primary: "cloudy", secondary: "rainy", pattern: "sometimes" };
  }
  if ([1, 2].includes(code)) {
    return { weatherText: "晴れ時々くもり", primary: "sunny", secondary: "cloudy", pattern: "sometimes" };
  }
  if ([3, 45, 48].includes(code)) {
    return { weatherText: "くもり", primary: "cloudy", pattern: "single" };
  }
  return { weatherText: "晴れ", primary: "sunny", pattern: "single" };
}
