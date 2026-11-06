"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Download, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InlineAudioPlayerProps {
  src: string;
  className?: string;
  compact?: boolean;
}

function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function InlineAudioPlayer({
  src,
  className,
  compact = false,
}: InlineAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const cyclePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (compact) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-2.5 py-1 text-xs shadow-xs backdrop-blur-xs",
          className
        )}
      >
        <audio ref={audioRef} src={src} preload="metadata" />
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          onClick={togglePlay}
          className="h-6 w-6 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
        >
          {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
        </Button>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {formatAudioTime(currentTime)} / {formatAudioTime(duration)}
        </span>
        <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl border border-border/80 bg-muted/40 p-2.5 text-xs shadow-xs backdrop-blur-xs",
        className
      )}
    >
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <Button
        type="button"
        size="icon-sm"
        variant="default"
        onClick={togglePlay}
        className="rounded-full shadow-xs"
      >
        {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
      </Button>

      <span className="font-mono text-[11px] tabular-nums text-muted-foreground w-10 text-right">
        {formatAudioTime(currentTime)}
      </span>

      <div className="relative flex-1 min-w-[80px] h-6 flex items-center">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted-foreground/20 accent-primary focus:outline-none"
        />
      </div>

      <span className="font-mono text-[11px] tabular-nums text-muted-foreground w-10">
        {formatAudioTime(duration)}
      </span>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          onClick={cyclePlaybackRate}
          className="h-6 px-1.5 font-mono text-[10px] text-muted-foreground hover:text-foreground"
          title="Playback speed"
        >
          {playbackRate}x
        </Button>

        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          onClick={toggleMute}
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="h-3.5 w-3.5 text-destructive" /> : <Volume2 className="h-3.5 w-3.5" />}
        </Button>

        <a
          href={src}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Download recording"
        >
          <Download className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
