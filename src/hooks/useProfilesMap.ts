import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
}

export interface ProfilesMap {
  [key: string]: string;
}

export function useProfilesMap() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profilesMap, setProfilesMap] = useState<ProfilesMap>({});
  const [loading, setLoading] = useState(false);

  // Fetch all profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, first_name, last_name")
      .order("username");
    
    if (!error && data) {
      setProfiles(data);
      const map: ProfilesMap = {};
      data.forEach((p: Profile) => {
        map[p.id] = getDisplayName(p);
      });
      setProfilesMap(map);
    }
    setLoading(false);
  };

  // Build a map from an array of user IDs
  const buildProfilesMap = useCallback(async (userIds: string[]): Promise<ProfilesMap> => {
    if (!userIds.length) return {};
    
    const uniqueIds = [...new Set(userIds.filter(Boolean))];
    if (!uniqueIds.length) return {};

    const { data } = await supabase
      .from("profiles")
      .select("id, username, first_name, last_name")
      .in("id", uniqueIds);

    const map: ProfilesMap = {};
    (data || []).forEach((p: Profile) => {
      map[p.id] = getDisplayName(p);
    });
    return map;
  }, []);

  return {
    profiles,
    profilesMap,
    loading,
    buildProfilesMap,
    getDisplayName,
    getUserName: (userId: string | null | undefined) => {
      if (!userId) return "Unknown User";
      return profilesMap[userId] || "Unknown User";
    }
  };
}

// Utility function to get display name from profile
export function getDisplayName(profile: Profile | null | undefined): string {
  if (!profile) return "Unknown User";
  if (profile.username) return profile.username;
  if (profile.first_name || profile.last_name) {
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
  }
  return "Unknown User";
}
