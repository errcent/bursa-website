"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { fetchViewerChatRooms } from "@/lib/chat/api";
import { isPublicCommunityRoom } from "@/lib/chat/access";
import type { ChatRoom } from "@/lib/chat/types";
import { fetchMentorChatRooms, fetchMentorProfile } from "@/lib/mentor/api";

const UNREAD_POLL_MS = 15_000;

/**
 * Loads role-scoped room ids (and room list) for client-side list privacy.
 * - Mentors: owned / moderated hub ids
 * - Learners: subscribed mentor hub ids (ChatRoomMember) + public rooms
 * Periodically refreshes rooms so unread badges stay current while browsing lists.
 */
export function useMentorRoomScope() {
  const { session } = useAuth();
  const [mentorProfileId, setMentorProfileId] = useState<string | null>(null);
  const [accessibleHubIds, setAccessibleHubIds] = useState<string[]>([]);
  const [subscribedHubIds, setSubscribedHubIds] = useState<string[]>([]);
  const [viewerRooms, setViewerRooms] = useState<ChatRoom[] | null>(null);
  const needsScope = session?.role === "mentor" || session?.role === "learner";
  const [ready, setReady] = useState(!needsScope);

  const refreshRooms = useCallback(async (opts?: { full?: boolean }) => {
    if (!session?.email || (session.role !== "mentor" && session.role !== "learner")) {
      return;
    }
    try {
      if (session.role === "mentor") {
        if (opts?.full) {
          const [profile, hubs, rooms] = await Promise.all([
            fetchMentorProfile(),
            fetchMentorChatRooms(),
            fetchViewerChatRooms(),
          ]);
          setMentorProfileId(profile.id);
          setAccessibleHubIds(hubs.map((h) => h.id));
          setSubscribedHubIds([]);
          setViewerRooms(rooms);
        } else {
          const rooms = await fetchViewerChatRooms();
          setViewerRooms(rooms);
        }
      } else {
        const rooms = await fetchViewerChatRooms();
        setMentorProfileId(null);
        setAccessibleHubIds([]);
        setSubscribedHubIds(
          rooms
            .filter((r) => !isPublicCommunityRoom(r) && r.roomKind === "mentor_community")
            .map((r) => r.id)
        );
        setViewerRooms(rooms);
      }
    } catch {
      /* keep previous snapshot */
    }
  }, [session?.email, session?.role]);

  useEffect(() => {
    if (!session?.email || (session.role !== "mentor" && session.role !== "learner")) {
      setMentorProfileId(null);
      setAccessibleHubIds([]);
      setSubscribedHubIds([]);
      setViewerRooms(null);
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);

    (async () => {
      try {
        await refreshRooms({ full: true });
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    const interval = window.setInterval(() => {
      void refreshRooms();
    }, UNREAD_POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshRooms();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [session?.role, session?.email, refreshRooms]);

  return {
    mentorProfileId,
    accessibleHubIds,
    subscribedHubIds,
    viewerRooms,
    ready,
    refreshRooms: () => refreshRooms(),
  };
}
