import { useMutation } from '@tanstack/react-query';
import { ApiResponse, GameResult } from '../../../../shared/types/api';

interface GuessSubmissionRequest {
  guessPostId: string;
}

export function useCheckGuess() {
  return useMutation<ApiResponse<GameResult>, ApiResponse, GuessSubmissionRequest>({
    mutationFn: async ({ guessPostId }) => {
      const res = await fetch('/api/game/guess', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ guessPostId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => {},
  });
}
