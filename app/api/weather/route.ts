import { NextResponse } from "next/server";
import { classifyWeather, formatDateLabel, type DayMode } from "@/lib/weather";

const SAPPORO = {
  latitude: 43.0618,
  longitude: 141.3545
};

function getTargetIndex(day: DayMode) {
  return day === "tomorrow" ? 1 : 0;
}

function maxFromHours(values: number[], start: number, end: number) {
  const sliced = values.slice(start, end).filter((value) => Number.isFinite(value));
  if (sliced.length === 0) return 0;
  return Math.round(Math.max(...sliced));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const day = searchParams.get("day") === "tomorrow" ? "tomorrow" : "today";
  const targetIndex = getTargetIndex(day);

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(SAPPORO.latitude),
    longitude: String(SAPPORO.longitude),
    timezone: "Asia/Tokyo",
    forecast_days: "2",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
    hourly: "precipitation_probability"
  }).toString();

  const response = await fetch(url, {
    next: { revalidate: 60 * 30 }
  });

  if (!response.ok) {
    return NextResponse.json({ error: "天気情報を取得できませんでした" }, { status: 502 });
  }

  const data = await response.json();
  const daily = data.daily;
  const startHour = targetIndex * 24;
  const hourlyPop = data.hourly?.precipitation_probability?.slice(startHour, startHour + 24) ?? [];
  const targetDate = new Date(`${daily.time[targetIndex]}T00:00:00+09:00`);
  const weather = classifyWeather(daily.weather_code[targetIndex], daily.precipitation_sum[targetIndex]);

  return NextResponse.json({
    day,
    dateLabel: formatDateLabel(targetDate),
    ...weather,
    maxTemp: Math.round(daily.temperature_2m_max[targetIndex]),
    minTemp: Math.round(daily.temperature_2m_min[targetIndex]),
    amPop: maxFromHours(hourlyPop, 0, 12),
    pmPop: maxFromHours(hourlyPop, 12, 24)
  });
}
