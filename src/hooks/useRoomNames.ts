import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let cache: Record<string, string> | null = null;
let inflight: Promise<Record<string, string>> | null = null;

async function loadRooms(): Promise<Record<string, string>> {
  if (cache) return cache;
  if (!inflight) {
    inflight = (async () => {
      const { data } = await supabase.from("rooms").select("id, room_type, room_number");
      cache = (data || []).reduce((acc: Record<string, string>, r: any) => {
        acc[r.id] = r.room_type || r.room_number || r.id;
        return acc;
      }, {});
      return cache;
    })();
  }
  return inflight;
}

/**
 * Resolves room UUIDs (stored in hotel_bookings.room_type) to readable room names.
 */
export function useRoomNames() {
  const [map, setMap] = useState<Record<string, string>>(cache || {});

  useEffect(() => {
    let active = true;
    loadRooms().then((m) => {
      if (active) setMap({ ...m });
    });
    return () => {
      active = false;
    };
  }, []);

  const roomName = useCallback(
    (value?: string | null, fallback = "-") => {
      if (!value) return fallback;
      if (UUID_RE.test(value)) return map[value] || fallback;
      return value;
    },
    [map]
  );

  return { roomNamesMap: map, roomName };
}

export const isRoomUuid = (v?: string | null) => !!v && UUID_RE.test(v);
