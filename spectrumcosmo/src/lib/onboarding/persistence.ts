import { queryOne, queryMany } from '@/lib/db';
import { UserOnboardingProgress } from './types';

const STORAGE_KEY = 'spectrumcosmo_onboarding';

export async function getUserOnboardingStatus(userId: string | null, sessionId: string): Promise<UserOnboardingProgress | null> {
  if (userId) {
    try {
      const result = await queryOne<UserOnboardingProgress>`
        SELECT 
          user_id as "userId",
          session_id as "sessionId",
          has_completed as "hasCompleted",
          current_step as "currentStep",
          last_updated as "lastUpdated"
        FROM user_onboarding 
        WHERE user_id = ${userId}::uuid
        ORDER BY last_updated DESC 
        LIMIT 1
      `;
      if (result) return result;
    } catch (err) {
      console.error('Failed to fetch onboarding status from DB:', err);
    }
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        const data = JSON.parse(local);
        return {
          userId: null,
          sessionId: data.sessionId || sessionId,
          hasCompleted: data.hasCompleted || false,
          currentStep: data.currentStep || 0,
          lastUpdated: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.error('Failed to fetch onboarding from localStorage:', err);
    }
  }

  return null;
}

export async function saveOnboardingProgress(
  userId: string | null,
  sessionId: string,
  hasCompleted: boolean,
  currentStep: number
): Promise<void> {
  // Save to localStorage always
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        sessionId,
        hasCompleted,
        currentStep,
        lastUpdated: new Date().toISOString(),
      }));
    } catch (err) {
      console.error('Failed to save onboarding to localStorage:', err);
    }
  }

  // Save to DB if logged in
  if (userId) {
    try {
      await queryOne`
        INSERT INTO user_onboarding (user_id, session_id, has_completed, current_step, last_updated)
        VALUES (${userId}::uuid, ${sessionId}, ${hasCompleted}, ${currentStep}, NOW())
        ON CONFLICT (user_id, session_id) 
        DO UPDATE SET 
          has_completed = EXCLUDED.has_completed,
          current_step = EXCLUDED.current_step,
          last_updated = NOW()
      `;
    } catch (err) {
      console.error('Failed to save onboarding to DB:', err);
    }
  }
}

export async function resetOnboarding(userId: string | null, sessionId: string): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }

  if (userId) {
    try {
      await queryOne`
        DELETE FROM user_onboarding 
        WHERE user_id = ${userId}::uuid
      `;
    } catch (err) {
      console.error('Failed to reset onboarding in DB:', err);
    }
  }
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
