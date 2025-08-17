import { useState, useEffect } from "react";
import { client, type MovieGenre, type MovieRecommendation } from "./rpc";

export function useMovieGenres() {
  const [genres, setGenres] = useState<MovieGenre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await client.LIST_MOVIE_GENRES();
        setGenres(result.genres);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  return { genres, loading, error };
}

export function useMovieRecommendation() {
  const [recommendation, setRecommendation] =
    useState<MovieRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendation = async (
    includeGenreIds: number[],
    excludeGenreIds: number[] = []
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await client.RECOMMEND_MOVIE({
        includeGenreIds,
        excludeGenreIds:
          excludeGenreIds.length > 0 ? excludeGenreIds : undefined,
      });
      setRecommendation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const resetRecommendation = () => {
    setRecommendation(null);
    setError(null);
  };

  return {
    recommendation,
    loading,
    error,
    getRecommendation,
    resetRecommendation,
  };
}
