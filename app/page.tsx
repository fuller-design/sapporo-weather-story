"use client";

import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Download, Droplet, ExternalLink, ImagePlus, Shuffle, Sparkles } from "lucide-react";
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

type BackgroundAdjust = {
  zoom: number;
  x: number;
  y: number;
  blur: number;
  brightness: number;
  contrast: number;
  saturation: number;
  cool: number;
  warm: number;
};

type OverlayTone = "black" | "white" | "blue";

type TouchPoint = {
  x: number;
  y: number;
};

type BackgroundGesture = {
  startAdjust: BackgroundAdjust;
  startCenter: TouchPoint;
  startDistance: number;
};

type VideoBackground = {
  url: string;
  duration: number;
  currentTime: number;
  name: string;
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

const initialBackgroundAdjust: BackgroundAdjust = {
  zoom: 1,
  x: 0,
  y: 0,
  blur: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  cool: 0,
  warm: 0
};

const overlayRgb: Record<OverlayTone, string> = {
  black: "0, 0, 0",
  white: "255, 255, 255",
  blue: "122, 151, 176"
};

const backgroundLimits = {
  minZoom: 1,
  maxZoom: 2.4,
  minOffset: -35,
  maxOffset: 35,
  minBlur: 0,
  maxBlur: 18,
  minFilter: 0,
  maxFilter: 200,
  minTint: 0,
  maxTint: 45
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function clampBackgroundAdjust(adjust: BackgroundAdjust): BackgroundAdjust {
  return {
    zoom: clamp(adjust.zoom, backgroundLimits.minZoom, backgroundLimits.maxZoom),
    x: clamp(adjust.x, backgroundLimits.minOffset, backgroundLimits.maxOffset),
    y: clamp(adjust.y, backgroundLimits.minOffset, backgroundLimits.maxOffset),
    blur: clamp(adjust.blur, backgroundLimits.minBlur, backgroundLimits.maxBlur),
    brightness: clamp(adjust.brightness, 40, backgroundLimits.maxFilter),
    contrast: clamp(adjust.contrast, 40, backgroundLimits.maxFilter),
    saturation: clamp(adjust.saturation, 0, backgroundLimits.maxFilter),
    cool: clamp(adjust.cool, backgroundLimits.minTint, backgroundLimits.maxTint),
    warm: clamp(adjust.warm, backgroundLimits.minTint, backgroundLimits.maxTint)
  };
}

function getCenter(points: TouchPoint[]) {
  return points.reduce(
    (center, point) => ({ x: center.x + point.x / points.length, y: center.y + point.y / points.length }),
    { x: 0, y: 0 }
  );
}

function getDistance(pointA: TouchPoint, pointB: TouchPoint) {
  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
}

function getTouchPoints(touches: { length: number; item(index: number): { clientX: number; clientY: number } | null }): TouchPoint[] {
  const points: TouchPoint[] = [];
  for (let index = 0; index < touches.length; index += 1) {
    const touch = touches.item(index);
    if (touch) points.push({ x: touch.clientX, y: touch.clientY });
  }
  return points;
}

function dataUrlToBlob(dataUrl: string) {
  return fetch(dataUrl).then((response) => response.blob());
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (!src.startsWith("data:")) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image load failed"));
    image.src = src;
  });
}

function seekVideo(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve, reject) => {
    const safeTime = clamp(time, 0, Number.isFinite(video.duration) ? video.duration : 0);
    const cleanup = () => {
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
    };
    const handleSeeked = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error("video seek failed"));
    };

    if (Math.abs(video.currentTime - safeTime) < 0.04 && video.readyState >= 2) {
      resolve();
      return;
    }

    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("error", handleError);
    video.currentTime = safeTime;
  });
}

async function composeStoryPng(backgroundSrc: string, overlaySrc: string, adjust: BackgroundAdjust) {
  const width = 1080;
  const height = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas unavailable");

  const background = await loadImage(backgroundSrc);
  const coverScale = Math.max(width / background.naturalWidth, height / background.naturalHeight);
  const drawWidth = background.naturalWidth * coverScale;
  const drawHeight = background.naturalHeight * coverScale;
  const drawX = (width - drawWidth) / 2;
  const drawY = (height - drawHeight) / 2;

  context.save();
  context.translate(width / 2 + (width * adjust.x) / 100, height / 2 + (height * adjust.y) / 100);
  context.scale(adjust.zoom, adjust.zoom);
  context.filter = [
    adjust.blur > 0 ? `blur(${adjust.blur}px)` : "",
    `brightness(${adjust.brightness}%)`,
    `contrast(${adjust.contrast}%)`,
    `saturate(${adjust.saturation}%)`
  ].filter(Boolean).join(" ");
  const blurPad = adjust.blur * 4;
  context.drawImage(
    background,
    drawX - width / 2 - blurPad,
    drawY - height / 2 - blurPad,
    drawWidth + blurPad * 2,
    drawHeight + blurPad * 2
  );
  context.restore();
  if (adjust.cool > 0) {
    context.fillStyle = `rgba(91, 144, 190, ${adjust.cool / 100})`;
    context.fillRect(0, 0, width, height);
  }
  if (adjust.warm > 0) {
    context.fillStyle = `rgba(245, 178, 111, ${adjust.warm / 100})`;
    context.fillRect(0, 0, width, height);
  }

  const overlay = await loadImage(overlaySrc);
  context.drawImage(overlay, 0, 0, width, height);

  return canvas.toDataURL("image/png");
}

export default function Home() {
  const storyRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const activePointersRef = useRef<Map<number, TouchPoint>>(new Map());
  const backgroundGestureRef = useRef<BackgroundGesture | null>(null);
  const [weather, setWeather] = useState<StoryWeather>(initialWeather);
  const [assets, setAssets] = useState<AssetMap>({
    backgrounds: { sunny: [], cloudy: [], rainy: [], snow: [] },
    icons: {},
    detailedIcons: {}
  });
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [videoBackground, setVideoBackground] = useState<VideoBackground | null>(null);
  const [backgroundAdjust, setBackgroundAdjust] = useState<BackgroundAdjust>(initialBackgroundAdjust);
  const [overlayTone, setOverlayTone] = useState<OverlayTone>("black");
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isCapturingVideo, setIsCapturingVideo] = useState(false);
  const [notice, setNotice] = useState("");
  const [dateMain, dateWeekday] = weather.dateLabel.split(" ");
  const videoUrl = videoBackground?.url;

  useEffect(() => {
    fetch("/api/assets")
      .then((response) => response.json())
      .then((data: AssetMap) => setAssets(data))
      .catch(() => setNotice("素材一覧を読み込めませんでした。フォールバック表示で続行します。"));
  }, []);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const currentBackground = useMemo(() => {
    const fallback = fallbackBackgrounds[weather.primary];
    if (customBackground) {
      return { image: customBackground, fallback };
    }
    const pool = assets.backgrounds[weather.primary] ?? [];
    const selected = pool[weather.backgroundIndex % Math.max(pool.length, 1)];
    if (selected) {
      return { image: selected, fallback };
    }
    return { image: null, fallback };
  }, [assets.backgrounds, customBackground, weather.backgroundIndex, weather.primary]);

  const backgroundImageStyle = useMemo(
    () =>
      ({
        "--bg-zoom": backgroundAdjust.zoom,
        "--bg-x": `${backgroundAdjust.x}%`,
        "--bg-y": `${backgroundAdjust.y}%`,
        "--bg-blur": `${backgroundAdjust.blur}px`,
        "--bg-brightness": `${backgroundAdjust.brightness}%`,
        "--bg-contrast": `${backgroundAdjust.contrast}%`,
        "--bg-saturation": `${backgroundAdjust.saturation}%`,
        "--photo-cool": backgroundAdjust.cool / 100,
        "--photo-warm": backgroundAdjust.warm / 100
      }) as CSSProperties,
    [backgroundAdjust]
  );

  const storyStyle = useMemo(
    () =>
      ({
        backgroundImage: currentBackground.fallback,
        "--overlay-rgb": overlayRgb[overlayTone],
        "--overlay-opacity": overlayOpacity
      }) as CSSProperties,
    [currentBackground.fallback, overlayOpacity, overlayTone]
  );

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
    clearVideoBackground();
    setBackgroundAdjust(initialBackgroundAdjust);
  };

  const updateDay = (day: DayMode) => {
    const base = day === "tomorrow" ? new Date(Date.now() + 24 * 60 * 60 * 1000) : new Date();
    setWeather((current) => ({ ...current, day, dateLabel: formatDateLabel(base) }));
  };

  const shuffleBackground = () => {
    setCustomBackground(null);
    clearVideoBackground();
    setBackgroundAdjust(initialBackgroundAdjust);
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
      let dataUrl: string;
      if (currentBackground.image) {
        node.classList.add(styles.captureOverlay);
        try {
          const overlayUrl = await toPng(node, {
            cacheBust: true,
            pixelRatio,
            canvasWidth: 1080,
            canvasHeight: 1920,
            backgroundColor: "transparent"
          });
          dataUrl = await composeStoryPng(currentBackground.image, overlayUrl, backgroundAdjust);
        } finally {
          node.classList.remove(styles.captureOverlay);
        }
      } else {
        dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio,
          canvasWidth: 1080,
          canvasHeight: 1920,
          backgroundColor: "#efeee8"
        });
      }
      const filename = `sapporo-weather-${weather.day}-${Date.now()}.png`;
      const blob = await dataUrlToBlob(dataUrl);
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "SAPPORO STORY"
          });
          setNotice("共有シートから画像を保存できます。");
          return;
        } catch (shareError) {
          if (shareError instanceof DOMException && shareError.name === "AbortError") return;
        }
      }
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch {
      setNotice("PNG保存に失敗しました。背景画像の形式やブラウザ権限を確認してください。");
    } finally {
      setIsSaving(false);
    }
  };

  const clearVideoBackground = () => {
    setVideoBackground((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  const captureVideoFrame = useCallback(async (time = videoBackground?.currentTime ?? 0) => {
    const video = videoRef.current;
    if (!video) return;
    setIsCapturingVideo(true);
    setNotice("");
    try {
      await seekVideo(video, time);
      if (!video.videoWidth || !video.videoHeight) throw new Error("video size unavailable");
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("canvas unavailable");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      setCustomBackground(canvas.toDataURL("image/png"));
      setBackgroundAdjust(initialBackgroundAdjust);
      setNotice("動画のシーンを背景に設定しました。");
    } catch {
      setNotice("動画から画像を取り出せませんでした。別の動画か時間でお試しください。");
    } finally {
      setIsCapturingVideo(false);
    }
  }, [videoBackground?.currentTime]);

  const handleUpload = (file?: File) => {
    if (!file) return;
    if (file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setVideoBackground((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return { url, duration: 0, currentTime: 0, name: file.name };
      });
      setCustomBackground(null);
      setBackgroundAdjust(initialBackgroundAdjust);
      setNotice("動画を読み込みました。使いたいシーンを選んでください。");
      return;
    }
    clearVideoBackground();
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCustomBackground(reader.result);
        setBackgroundAdjust(initialBackgroundAdjust);
      }
    };
    reader.onerror = () => setNotice("背景画像を読み込めませんでした。別の画像でお試しください。");
    reader.readAsDataURL(file);
  };

  const startBackgroundGesture = useCallback((points: TouchPoint[]) => {
    if (!storyRef.current || points.length === 0) return;
    backgroundGestureRef.current = {
      startAdjust: backgroundAdjust,
      startCenter: getCenter(points),
      startDistance: points.length >= 2 ? getDistance(points[0], points[1]) : 0
    };
  }, [backgroundAdjust]);

  const updateBackgroundGesture = (points: TouchPoint[]) => {
    if (!currentBackground.image || !storyRef.current || !backgroundGestureRef.current || points.length === 0) return;
    const currentCenter = getCenter(points);
    const gesture = backgroundGestureRef.current;
    const storyRect = storyRef.current.getBoundingClientRect();
    const deltaX = ((currentCenter.x - gesture.startCenter.x) / storyRect.width) * 100;
    const deltaY = ((currentCenter.y - gesture.startCenter.y) / storyRect.height) * 100;
    const nextAdjust: BackgroundAdjust = {
      ...gesture.startAdjust,
      x: gesture.startAdjust.x + deltaX,
      y: gesture.startAdjust.y + deltaY
    };

    if (points.length >= 2 && gesture.startDistance > 0) {
      const nextDistance = getDistance(points[0], points[1]);
      nextAdjust.zoom = gesture.startAdjust.zoom * (nextDistance / gesture.startDistance);
    }

    setBackgroundAdjust(clampBackgroundAdjust(nextAdjust));
  };

  const handleBackgroundPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    if (!currentBackground.image) return;
    activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
    startBackgroundGesture(Array.from(activePointersRef.current.values()));
  };

  const handleBackgroundPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    if (!currentBackground.image || !storyRef.current || !backgroundGestureRef.current) return;
    if (!activePointersRef.current.has(event.pointerId)) return;
    event.preventDefault();
    activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    updateBackgroundGesture(Array.from(activePointersRef.current.values()));
  };

  const handleBackgroundPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    activePointersRef.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    startBackgroundGesture(Array.from(activePointersRef.current.values()));
  };

  const handleBackgroundTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (!currentBackground.image) return;
    startBackgroundGesture(getTouchPoints(event.touches));
  };

  const handleBackgroundTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (!currentBackground.image) return;
    event.preventDefault();
    updateBackgroundGesture(getTouchPoints(event.touches));
  };

  const handleBackgroundTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    const points = getTouchPoints(event.touches);
    if (points.length === 0) {
      backgroundGestureRef.current = null;
      return;
    }
    startBackgroundGesture(points);
  };

  return (
    <main className={styles.page}>
      <section className={styles.previewArea} aria-label="ストーリープレビュー">
        <div className={styles.phoneShell}>
          <div
            ref={storyRef}
            className={styles.story}
            style={storyStyle}
            onPointerDown={handleBackgroundPointerDown}
            onPointerMove={handleBackgroundPointerMove}
            onPointerUp={handleBackgroundPointerEnd}
            onPointerCancel={handleBackgroundPointerEnd}
            onPointerLeave={handleBackgroundPointerEnd}
            onTouchStart={handleBackgroundTouchStart}
            onTouchMove={handleBackgroundTouchMove}
            onTouchEnd={handleBackgroundTouchEnd}
            onTouchCancel={handleBackgroundTouchEnd}
          >
            {currentBackground.image ? (
              <img className={styles.storyBackgroundImage} src={currentBackground.image} alt="" style={backgroundImageStyle} />
            ) : null}
            <div className={styles.storyPhotoTone} style={backgroundImageStyle} />
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
          <a
            className={styles.iconButton}
            href="https://weathernews.jp/onebox/tenki/hokkaido/01100/"
            target="_blank"
            rel="noreferrer"
            title="ウェザーニュースを確認"
          >
            <ExternalLink size={20} />
          </a>
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
          背景画像・動画を選択
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(event) => {
              handleUpload(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </label>

        {videoBackground ? (
          <div className={styles.videoTools} aria-label="動画から背景シーンを選択">
            <video
              ref={videoRef}
              className={styles.videoPreview}
              src={videoBackground.url}
              muted
              playsInline
              preload="metadata"
              onLoadedMetadata={(event) => {
                const duration = Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0;
                setVideoBackground((current) => current ? { ...current, duration, currentTime: 0 } : current);
              }}
              onLoadedData={() => void captureVideoFrame(0)}
              onTimeUpdate={(event) => {
                const currentTime = event.currentTarget.currentTime;
                setVideoBackground((current) => current ? { ...current, currentTime } : current);
              }}
            />
            <div className={styles.toolHeader}>
              <span>動画シーン選択</span>
              <span>{videoBackground.name}</span>
            </div>
            <label className={styles.rangeField}>
              <span>時間</span>
              <input
                type="range"
                min="0"
                max={Math.max(videoBackground.duration, 0.1)}
                step="0.1"
                value={videoBackground.currentTime}
                onChange={(event) => {
                  const time = Number(event.target.value);
                  setVideoBackground((current) => current ? { ...current, currentTime: time } : current);
                  if (videoRef.current) videoRef.current.currentTime = time;
                }}
              />
            </label>
            <button
              type="button"
              className={styles.captureButton}
              onClick={() => captureVideoFrame(videoBackground.currentTime)}
              disabled={isCapturingVideo}
            >
              {isCapturingVideo ? "取り込み中..." : "このシーンを背景に設定"}
            </button>
          </div>
        ) : null}

        <div className={styles.backgroundTools} aria-label="背景画像の切り取り調整">
          <div className={styles.toolHeader}>
            <span>背景トリミング</span>
            <button type="button" onClick={() => setBackgroundAdjust(initialBackgroundAdjust)}>
              リセット
            </button>
          </div>
          <label className={styles.rangeField}>
            <span>拡大</span>
            <input
              type="range"
              min="1"
              max="2.4"
              step="0.01"
              value={backgroundAdjust.zoom}
              onChange={(event) => setBackgroundAdjust((current) => clampBackgroundAdjust({ ...current, zoom: Number(event.target.value) }))}
            />
          </label>
          <label className={styles.rangeField}>
            <span>左右</span>
            <input
              type="range"
              min="-35"
              max="35"
              step="1"
              value={backgroundAdjust.x}
              onChange={(event) => setBackgroundAdjust((current) => clampBackgroundAdjust({ ...current, x: Number(event.target.value) }))}
            />
          </label>
          <label className={styles.rangeField}>
            <span>上下</span>
            <input
              type="range"
              min="-35"
              max="35"
              step="1"
              value={backgroundAdjust.y}
              onChange={(event) => setBackgroundAdjust((current) => clampBackgroundAdjust({ ...current, y: Number(event.target.value) }))}
            />
          </label>
          <label className={styles.rangeField}>
            <span>ぼかし</span>
            <input
              type="range"
              min="0"
              max="18"
              step="1"
              value={backgroundAdjust.blur}
              onChange={(event) => setBackgroundAdjust((current) => clampBackgroundAdjust({ ...current, blur: Number(event.target.value) }))}
            />
          </label>
          <label className={styles.rangeField}>
            <span>明るさ</span>
            <input
              type="range"
              min="40"
              max="200"
              step="1"
              value={backgroundAdjust.brightness}
              onChange={(event) => setBackgroundAdjust((current) => clampBackgroundAdjust({ ...current, brightness: Number(event.target.value) }))}
            />
          </label>
          <label className={styles.rangeField}>
            <span>コントラスト</span>
            <input
              type="range"
              min="40"
              max="200"
              step="1"
              value={backgroundAdjust.contrast}
              onChange={(event) => setBackgroundAdjust((current) => clampBackgroundAdjust({ ...current, contrast: Number(event.target.value) }))}
            />
          </label>
          <label className={styles.rangeField}>
            <span>彩度</span>
            <input
              type="range"
              min="0"
              max="200"
              step="1"
              value={backgroundAdjust.saturation}
              onChange={(event) => setBackgroundAdjust((current) => clampBackgroundAdjust({ ...current, saturation: Number(event.target.value) }))}
            />
          </label>
          <label className={styles.rangeField}>
            <span>青み</span>
            <input
              type="range"
              min="0"
              max="45"
              step="1"
              value={backgroundAdjust.cool}
              onChange={(event) => setBackgroundAdjust((current) => clampBackgroundAdjust({ ...current, cool: Number(event.target.value) }))}
            />
          </label>
          <label className={styles.rangeField}>
            <span>暖色</span>
            <input
              type="range"
              min="0"
              max="45"
              step="1"
              value={backgroundAdjust.warm}
              onChange={(event) => setBackgroundAdjust((current) => clampBackgroundAdjust({ ...current, warm: Number(event.target.value) }))}
            />
          </label>
          <label className={styles.rangeField}>
            <span>色</span>
            <select value={overlayTone} onChange={(event) => setOverlayTone(event.target.value as OverlayTone)}>
              <option value="black">黒</option>
              <option value="white">白</option>
              <option value="blue">青</option>
            </select>
          </label>
          <label className={styles.rangeField}>
            <span>濃さ</span>
            <input
              type="range"
              min="0"
              max="0.45"
              step="0.01"
              value={overlayOpacity}
              onChange={(event) => setOverlayOpacity(Number(event.target.value))}
            />
          </label>
        </div>

        <div className={styles.actions}>
          <a href="https://weathernews.jp/onebox/tenki/hokkaido/01100/" target="_blank" rel="noreferrer">
            <ExternalLink size={18} />
            ウェザーニュースを確認
          </a>
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

        {notice ? <p className={styles.notice}>{notice}</p> : null}
      </section>
    </main>
  );
}
