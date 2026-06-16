"use client";

import { useEffect, useState } from "react";
import { onWsEvent, joinCampaignRoom, leaveCampaignRoom } from "@/lib/websocket";
import type { WsCampaignProgressEvent, WsCampaignCompleteEvent } from "@/lib/types";

interface CampaignProgress {
  dialed: number;
  answered: number;
  failed: number;
  remaining: number;
  isComplete: boolean;
}

export function useCampaignProgress(campaignId: string | undefined) {
  const [progress, setProgress] = useState<CampaignProgress>({
    dialed: 0, answered: 0, failed: 0, remaining: 0, isComplete: false,
  });

  useEffect(() => {
    if (!campaignId) return;
    joinCampaignRoom(campaignId);

    const unsubProgress = onWsEvent("campaign:progress", (data: WsCampaignProgressEvent["data"]) => {
      if (data.campaignId === campaignId) {
        setProgress((prev) => ({
          ...prev, dialed: data.dialed, answered: data.answered,
          failed: data.failed, remaining: data.remaining,
        }));
      }
    });

    const unsubComplete = onWsEvent("campaign:complete", (data: WsCampaignCompleteEvent["data"]) => {
      if (data.campaignId === campaignId) {
        setProgress((prev) => ({ ...prev, isComplete: true }));
      }
    });

    return () => {
      leaveCampaignRoom(campaignId);
      unsubProgress();
      unsubComplete();
    };
  }, [campaignId]);

  return { progress, isRunning: !progress.isComplete };
}
