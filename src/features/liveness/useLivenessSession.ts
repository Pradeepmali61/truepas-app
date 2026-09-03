import { useCallback, useState } from 'react';

import { api } from '@/api';
import type {
    LivenessChallenge,
    LivenessChallengeResponse,
    LivenessEvidenceResponse,
    LivenessFinalizeResponse,
} from '@/types/domain';

type LivenessPhase = 'idle' | 'creating' | 'challenging' | 'finalizing' | 'passed' | 'failed';

interface LivenessSessionState {
  phase: LivenessPhase;
  challenge: LivenessChallengeResponse | null;
  currentStepIndex: number;
  currentChallenge: LivenessChallenge | null;
  instruction: string;
  error: string | null;
  result: LivenessFinalizeResponse | null;
}

/**
 * Orchestrates the active liveness challenge flow:
 *   create challenge → submit evidence for each step → finalize
 *
 * The server provides the challenge sequence; we render it in order.
 * After all steps are accepted, we capture a high-res frame and finalize.
 * The resulting session_id + session_token are used for face enrollment.
 */
export function useLivenessSession() {
  const [state, setState] = useState<LivenessSessionState>({
    phase: 'idle',
    challenge: null,
    currentStepIndex: 0,
    currentChallenge: null,
    instruction: '',
    error: null,
    result: null,
  });

  const startSession = useCallback(async (personId?: string) => {
    setState({ ...initialState, phase: 'creating' });
    try {
      const challenge = await api.createLivenessChallenge(personId);
      const firstChallenge = challenge.challenge_sequence[0];
      setState({
        phase: 'challenging',
        challenge,
        currentStepIndex: 0,
        currentChallenge: firstChallenge,
        instruction: challenge.ui_copy[firstChallenge],
        error: null,
        result: null,
      });
      return challenge;
    } catch (err: any) {
      setState({ ...initialState, phase: 'failed', error: err?.message ?? 'Failed to start liveness challenge' });
      throw err;
    }
  }, []);

  const submitEvidence = useCallback(
    async (durationMs: number): Promise<LivenessEvidenceResponse> => {
      if (!state.challenge || !state.currentChallenge) {
        throw new Error('No active liveness session');
      }

      // Per KYC guide §4.2: Evidence carries NO image — only step metadata.
      const evidence = await api.submitLivenessEvidence(
        state.challenge.session_id,
        {
          challenge: state.currentChallenge,
          step_index: state.currentStepIndex,
          client_ts_ms: Date.now(),
          duration_ms: durationMs,
        },
        state.challenge.session_token,
      );

      if (!evidence.step_accepted || evidence.status === 'failed') {
        setState((prev) => ({
          ...prev,
          phase: 'failed',
          error: 'Liveness check failed. Please try again.',
        }));
        throw new Error('Liveness step rejected');
      }

      // Advance to next challenge or mark as ready to finalize
      const nextIndex = state.currentStepIndex + 1;
      const nextChallenge = evidence.next_challenge;

      if (nextChallenge && nextIndex < state.challenge.challenge_sequence.length) {
        setState((prev) => ({
          ...prev,
          currentStepIndex: nextIndex,
          currentChallenge: nextChallenge,
          instruction: evidence.next_instruction ?? prev.challenge!.ui_copy[nextChallenge],
        }));
      } else {
        // All steps done — ready to finalize
        setState((prev) => ({
          ...prev,
          phase: 'finalizing',
          currentChallenge: null,
          instruction: 'Hold still...',
        }));
      }

      return evidence;
    },
    [state],
  );

  const finalize = useCallback(async (frameBase64: string): Promise<LivenessFinalizeResponse> => {
    if (!state.challenge) {
      throw new Error('No active liveness session');
    }

    const result = await api.finalizeLiveness(
      state.challenge.session_id,
      frameBase64,
      state.challenge.session_token,
    );

    if (result.status === 'passed') {
      setState((prev) => ({
        ...prev,
        phase: 'passed',
        result,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        phase: 'failed',
        result,
        error: result.message || 'Liveness verification failed',
      }));
    }

    return result;
  }, [state]);

  const reset = useCallback(() => {
    setState({ ...initialState });
  }, []);

  return {
    ...state,
    startSession,
    submitEvidence,
    finalize,
    reset,
    /** Session credentials for face enrollment (available after finalize passes). */
    sessionId: state.challenge?.session_id ?? null,
    sessionToken: state.challenge?.session_token ?? null,
  };
}

const initialState: LivenessSessionState = {
  phase: 'idle',
  challenge: null,
  currentStepIndex: 0,
  currentChallenge: null,
  instruction: '',
  error: null,
  result: null,
};
