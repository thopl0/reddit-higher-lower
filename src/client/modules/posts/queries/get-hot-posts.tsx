import { useQuery } from '@tanstack/react-query';
import { RedditPost } from '../../../types/post';

export const useGetHotPosts = () => {
  return useQuery<RedditPost[], Error>({
    queryKey: ['posts'],
    queryFn: async () => {
      const res = await fetch('/api/posts', {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });
};
