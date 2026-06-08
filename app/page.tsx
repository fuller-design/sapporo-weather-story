"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Droplet, ImagePlus, RefreshCw, Shuffle, Sparkles, Wand2 } from "lucide-react";
import { WeatherIcon } from "@/app/components/WeatherIcon";
import {
  fallbackComments,
  formatDateLabel,
  getWeatherOption,
  weatherOptions,
  type DayMode,
  type StoryWeather,
  type WeatherKind
} from "@/lib/weather";
import styles from "./page.module.css";

type AssetMap = {
  backgrounds: Record<WeatherKind, string[]>;
  icons: Partial<Record<WeatherKind, string | null>>;
  detailedIcons: Record<string, string>;
};

const initialWeather: StoryWeather = {
  day: "today",
  dateLabel: formatDateLabel(),
  weatherText: "くもり時々雨",
  iconKey: "cloudy_rainy",
  primary: "cloudy",
  secondary: "rainy",
  pattern: "sometimes",
  maxTemp: 22,
  minTemp: 15,
  amPop: 40,
  pmPop: 60,
  comment: "本日も傘をお忘れなく☂️",
  backgroundIndex: 0
};

const fallbackBackgrounds: Record<WeatherKind, string> = {
  sunny: "linear-gradient(160deg, #f5d899 0%, #fff8d7 42%, #a6cfc4 100%)",
  cloudy: "linear-gradient(160deg, #c8d0cf 0%, #ecebe5 48%, #9ca9a8 100%)",
  rainy: "linear-gradient(160deg, #6f8ca5 0%, #d7dedc 52%, #435964 100%)",
  snow: "linear-gradient(160deg, #dce8e9 0%, #f9faf5 52%, #aabdc3 100%)"
};

function pickRandomIndex(length: number, current = -1) {
  if (length <= 1) return 0;
  let next = Math.floor(Math.random() * length);
  if (next === current) next = (next + 1) % length;
  return next;
}

function normalizePercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

export default function Home() {
  const storyRef = useRef<HTMLDivElement>(null);
  const [weather, setWeather] = useState<StoryWeather>(initialWeather);
  const [assets, setAssets] = useState<AssetMap>({
    backgrounds: { sunny: [], cloudy: [], rainy: [], snow: [] },
    icons: {},
    detailedIcons: {}
  });
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [dateMain, dateWeekday] = weather.dateLabel.split(" ");

  useEffect(() => {
    fetch("/api/assets")
      .then((response) => response.json())
      .then((data: AssetMap) => setAssets(data))
      .catch(() => setNotice("素材一覧を読み込めませんでした。フォールバック表示で続行します。"));
  }, []);

  const currentBackground = useMemo(() => {
    if (customBackground) {
      return { backgroundImage: `url(${customBackground})` };
    }
    const pool = assets.backgrounds[weather.primary] ?? [];
    const selected = pool[weather.backgroundIndex % Math.max(pool.length, 1)];
    if (selected) {
      return { backgroundImage: `url(${selected})` };
    }
    return { backgroundImage: fallbackBackgrounds[weather.primary] };
  }, [assets.backgrounds, customBackground, weather.backgroundIndex, weather.primary]);

  const updateWeatherText = (weatherText: string) => {
    const option = getWeatherOption(weatherText);
    setWeather((current) => ({
      ...current,
      weatherText,
      iconKey: option.iconKey,
      primary: option.primary,
      secondary: option.secondary,
      pattern: option.pattern,
      backgroundIndex: pickRandomIndex(assets.backgrounds[option.primary]?.length ?? 0)
    }));
    setCustomBackground(null);
  };

  const updateDay = (day: DayMode) => {
    const base = day === "tomorrow" ? new Date(Date.now() + 24 * 60 * 60 * 1000) : new Date();
    setWeather((current) => ({ ...current, day, dateLabel: formatDateLabel(base) }));
  };

  const fetchWeather = async () => {
    setIsFetchingWeather(true);
    setNotice("");
    try {
      const response = await fetch(`/api/weather?day=${weather.day}`);
      if (!response.ok) throw new Error("weather fetch failed");
      const data = await response.json();
      const option = getWeatherOption(data.weatherText);
      setWeather((current) => ({
        ...current,
        ...data,
        iconKey: option.iconKey,
        backgroundIndex: pickRandomIndex(assets.backgrounds[data.primary as WeatherKind]?.length ?? 0)
      }));
      setCustomBackground(null);
    } catch {
      setNotice("天気情報を取得できませんでした。入力欄から手動で調整できます。");
    } finally {
      setIsFetchingWeather(false);
    }
  };

  const shuffleBackground = () => {
    setCustomBackground(null);
    setWeather((current) => ({
      ...current,
      backgroundIndex: pickRandomIndex(assets.backgrounds[current.primary]?.length ?? 0, current.backgroundIndex)
    }));
  };

  const generateComment = useCallback(async () => {
    try {
      const response = await fetch(`/comments/${weather.primary}.json`);
      if (!response.ok) throw new Error("comment fetch failed");
      const data = await response.json();
      const comments = Array.isArray(data.comments) ? data.comments : fallbackComments[weather.primary];
      setWeather((current) => ({ ...current, comment: comments[pickRandomIndex(comments.length)] }));
    } catch {
      const comments = fallbackComments[weather.primary];
      setWeather((current) => ({ ...current, comment: comments[pickRandomIndex(comments.length)] }));
    }
  }, [weather.primary]);

  const savePng = async () => {
    const node = storyRef.current;
    if (!node) return;
    setIsSaving(true);
    setNotice("");
    try {
      const { toPng } = await import("html-to-image");
      await document.fonts.ready;
      const pixelRatio = 1080 / node.offsetWidth;
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio,
        canvasWidth: 1080,
        canvasHeight: 1920,
        backgroundColor: "#efeee8"
      });
      const link = document.createElement("a");
      link.download = `sapporo-weather-${weather.day}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setNotice("PNG保存に失敗しました。背景画像の形式やブラウザ権限を確認してください。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomBackground(url);
  };

  return (
    <main className={styles.page}>
      <section className={styles.previewArea} aria-label="ストーリープレビュー">
        <div className={styles.phoneShell}>
          <div ref={storyRef} className={styles.story} style={currentBackground}>
            <div className={styles.storyShade} />
            <div className={styles.storyContent}>
              <header className={styles.storyHeader}>
                <div className={styles.dateLine}>
                  <span className={styles.dateMain}>{dateMain}</span>
                  <span className={styles.dateWeekday}>{dateWeekday}</span>
                </div>
                <div className={styles.headerRule} />
                <p>SAPPORO</p>
              </header>

              <section className={styles.weatherBlock}>
                <WeatherIcon
                  iconKey={weather.iconKey}
                  primary={weather.primary}
                  secondary={weather.secondary}
                  pattern={weather.pattern}
                  icons={assets.icons}
                  detailedIcons={assets.detailedIcons}
                />
                <h1>{weather.weatherText}</h1>
                <div className={styles.storyDivider} />
              </section>

              <section className={styles.temps} aria-label="気温">
                <p>{weather.maxTemp}<span>℃</span></p>
                <p>{weather.minTemp}<span>℃</span></p>
              </section>

              <section className={styles.precipGrid} aria-label="降水確率">
                <div className={styles.precipCircle}>
                  <p>AM</p>
                  <div className={styles.precipValue}>
                    <Droplet aria-hidden="true" strokeWidth={1.4} />
                    <span>{weather.amPop}<small>%</small></span>
                  </div>
                </div>
                <div className={styles.precipCircle}>
                  <p>PM</p>
                  <div className={styles.precipValue}>
                    <Droplet aria-hidden="true" strokeWidth={1.4} />
                    <span>{weather.pmPop}<small>%</small></span>
                  </div>
                </div>
              </section>

              <p className={styles.comment}>{weather.comment}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.controls} aria-label="管理画面">
        <div className={styles.controlHeader}>
          <div>
            <p className={styles.kicker}>SAPPORO STORY</p>
            <h2>天気画像生成</h2>
          </div>
          <button className={styles.iconButton} type="button" onClick={fetchWeather} disabled={isFetchingWeather} title="天気取得">
            <RefreshCw size={20} />
          </button>
        </div>

        <div className={styles.segmented} role="group" aria-label="今日／明日切替">
          <button className={weather.day === "today" ? styles.active : ""} type="button" onClick={() => updateDay("today")}>
            今日
          </button>
          <button className={weather.day === "tomorrow" ? styles.active : ""} type="button" onClick={() => updateDay("tomorrow")}>
            明日
          </button>
        </div>

        <label className={styles.field}>
          <span>天気</span>
          <select value={weather.weatherText} onChange={(event) => updateWeatherText(event.target.value)}>
            {weatherOptions.map((option) => (
              <option key={option.text} value={option.text}>
                {option.text}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.grid2}>
          <label className={styles.field}>
            <span>最高気温</span>
            <input type="number" value={weather.maxTemp} onChange={(event) => setWeather((current) => ({ ...current, maxTemp: Number(event.target.value) }))} />
          </label>
          <label className={styles.field}>
            <span>最低気温</span>
            <input type="number" value={weather.minTemp} onChange={(event) => setWeather((current) => ({ ...current, minTemp: Number(event.target.value) }))} />
          </label>
        </div>

        <div className={styles.grid2}>
          <label className={styles.field}>
            <span>AM降水確率</span>
            <input
              type="number"
              min="0"
              max="100"
              value={weather.amPop}
              onChange={(event) => setWeather((current) => ({ ...current, amPop: normalizePercent(Number(event.target.value)) }))}
            />
          </label>
          <label className={styles.field}>
            <span>PM降水確率</span>
            <input
              type="number"
              min="0"
              max="100"
              value={weather.pmPop}
              onChange={(event) => setWeather((current) => ({ ...current, pmPop: normalizePercent(Number(event.target.value)) }))}
            />
          </label>
        </div>

        <label className={styles.field}>
          <span>ひとこと</span>
          <textarea value={weather.comment} rows={3} onChange={(event) => setWeather((current) => ({ ...current, comment: event.target.value }))} />
        </label>

        <label className={styles.upload}>
          <ImagePlus size={18} />
          背景画像を一時アップロード
          <input type="file" accept="image/*" onChange={(event) => handleUpload(event.target.files?.[0])} />
        </label>

        <div className={styles.actions}>
          <button type="button" onClick={fetchWeather} disabled={isFetchingWeather}>
            <RefreshCw size={18} />
            天気取得
          </button>
          <button type="button" onClick={shuffleBackground}>
            <Shuffle size={18} />
            背景変更
          </button>
          <button type="button" onClick={generateComment}>
            <Sparkles size={18} />
            ひとこと自動生成
          </button>
          <button type="button" onClick={savePng} disabled={isSaving} className={styles.primary}>
            <Download size={18} />
            PNG保存
          </button>
        </div>

        <button type="button" className={styles.wideGenerate} onClick={savePng} disabled={isSaving}>
          <Wand2 size={18} />
          画像生成
        </button>

        {notice ? <p className={styles.notice}>{notice}</p> : null}
      </section>
    </main>
  );
}
