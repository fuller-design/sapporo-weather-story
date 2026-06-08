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
  sunny: ["今日は気持ちのよい空になりそうです", "日差しを味方に、軽やかな一日を", "朝晩の寒暖差にお気をつけて"],
  cloudy: ["空は控えめでも、穏やかに過ごせそうです", "羽織ものがあると安心です", "雲の多い一日になりそうです"],
  rainy: ["本日も傘をお忘れなく☂️", "折りたたみ傘があると安心です", "足元にお気をつけて"],
  snow: ["雪道にお気をつけてお出かけください", "あたたかくしてお過ごしください", "路面の変化にご注意ください"]
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
