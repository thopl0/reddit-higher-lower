import { useMutation } from '@tanstack/react-query';
import { ApiResponse, GameResult } from '../../../../shared/types/api';

export function useStartGame() {
  return useMutation<ApiResponse<GameResult>, ApiResponse<{ timeLeft?: number }>, void>({
    mutationFn: async () => {
      const res = await fetch('/api/game/start', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => {},
  });
}
