import { API_BASE_URL } from "../config/constants";

export interface ChallengeResponse {
  id: string;
  title: string;
  description: string;
  descriptionHighlightTokens: Array<{
    token: string;
    isHighlighted: boolean;
  }>;
  instructions: string;
  difficulty: string;
  tags: string[];
  content: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  content: string;
  sender: "user" | "system";
  timestamp: string;
}

export interface ChatSessionResponse {
  sessionId: string;
  challengeId: string;
  userId: string;
  messages: ChatMessage[];
  understandingScore: number;
  remainingInteractions: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengesListResponse {
  content: ChallengeResponse[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface LessonTextSection {
  title: string;
  type: "TEXT";
  data: string;
}

export interface LessonGapFillSection {
  title: string;
  type: "GAP_FILL";
  data: {
    question: string;
    displayTokens: Array<{
      text: string;
      isBlank: boolean;
    }>;
    choices: Array<{
      text: string;
      isCorrect: boolean;
    }>;
    correctOptionIndex: number;
  };
}

export interface LessonImplementationSection {
  title: string;
  type: "IMPLEMENTATION";
  data: {
    title: string;
    description: string;
    codeSteps: Array<{
      order: number;
      code: string;
      explanation: string;
      highlightLines?: number[];
      diagram?: string;
    }>;
  };
}

export type LessonSection =
  | LessonTextSection
  | LessonGapFillSection
  | LessonImplementationSection;

interface LessonItem {
  id: string;
  challengeId: string;
  sections: LessonSection[];
  createdAt: string;
  updatedAt: string;
}

export interface LessonResponse {
  content: LessonItem[];
}

export const challengesApi = {
  /**
   * Get lessons for a challenge
   * @param challengeId - The challenge ID
   * @returns A promise that resolves to the lessons for the challenge
   */
  getLessons: async (challengeId: string): Promise<LessonResponse> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/lessons?challengeId=${challengeId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch lessons with status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching lessons:", error);
      throw error;
    }
  },

  /**
   * Get challenge details by ID
   * @param id - The challenge ID
   * @returns A promise that resolves to the challenge details
   */
  getChallenge: async (id: string): Promise<ChallengeResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/${id}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch challenge with status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching challenge:", error);
      throw error;
    }
  },

  /**
   * Get chat messages for a challenge
   * @param challengeId - The challenge ID
   * @param token - The authentication token
   * @returns A promise that resolves to the chat session
   */
  getChatSession: async (
    challengeId: string,
    token: string
  ): Promise<ChatSessionResponse> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/challenges/${challengeId}/chats`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch chat session with status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching chat session:", error);
      throw error;
    }
  },

  /**
   * Send a message to the chat
   * @param challengeId - The challenge ID
   * @param message - The message to send
   * @param token - The authentication token
   * @returns A promise that resolves to the updated chat session
   */
  sendChatMessage: async (
    challengeId: string,
    message: string,
    token: string
  ): Promise<ChatSessionResponse> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/challenges/${challengeId}/chats`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to send chat message with status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending chat message:", error);
      throw error;
    }
  },

  /**
   * Get a list of challenges with pagination
   * @param page - The page number (0-based)
   * @param size - The number of items per page
   * @param search - Optional search query
   * @param difficulty - Optional difficulty filter
   * @param tag - Optional tag filter
   * @returns A promise that resolves to the list of challenges with pagination info
   */
  getChallenges: async (
    page = 0,
    size = 10,
    search?: string,
    difficulty?: string,
    tag?: string
  ): Promise<ChallengesListResponse> => {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("size", size.toString());

      if (search) {
        params.append("search", search);
      }

      if (difficulty && difficulty !== "Any Difficulty") {
        params.append("difficulty", difficulty);
      }

      if (tag && tag !== "Any Tag") {
        params.append("tag", tag);
      }

      const response = await fetch(
        `${API_BASE_URL}/challenges?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch challenges with status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching challenges:", error);
      throw error;
    }
  },
};
