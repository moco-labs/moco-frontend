import { useQuery } from "@tanstack/react-query";
import { type LessonResponse, challengesApi } from "../challenges";

/**
 * Hook for fetching lessons for a challenge
 * @param challengeId - The challenge ID
 * @returns A query object with lessons data
 */
export function useLessons(challengeId: string) {
  return useQuery<LessonResponse, Error>({
    queryKey: ["lessons", challengeId],
    queryFn: () => challengesApi.getLessons(challengeId),
    enabled: !!challengeId,
  });
}
