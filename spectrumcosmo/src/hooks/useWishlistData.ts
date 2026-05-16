import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useWishlistData() {
  const { data, error, mutate } = useSWR('/api/account/wishlist', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1 minute
  });

  return {
    wishlist: data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
