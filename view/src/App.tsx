import React, { useState } from "react";
import { client } from "./lib/rpc";
import { useMovieGenres } from "./lib/hooks";
import type {
  MovieRecommendation,
  MovieReviews,
  RecommendedMovie,
  WatchedMovie,
  GenreSuggestion,
} from "./lib/rpc";

function App() {
  const {
    genres,
    loading: genresLoading,
    error: genresError,
  } = useMovieGenres();
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [excludedGenres, setExcludedGenres] = useState<number[]>([]);
  const [recommendation, setRecommendation] =
    useState<MovieRecommendation | null>(null);
  const [showGenres, setShowGenres] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviews, setReviews] = useState<MovieReviews | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [recommendedMovies, setRecommendedMovies] = useState<
    RecommendedMovie[]
  >([]);
  const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [genreSuggestion, setGenreSuggestion] =
    useState<GenreSuggestion | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const handleIncludeGenre = (genreId: number) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(selectedGenres.filter((id) => id !== genreId));
    } else if (selectedGenres.length < 3) {
      setSelectedGenres([...selectedGenres, genreId]);
    }
  };

  const handleExcludeGenre = (genreId: number) => {
    if (excludedGenres.includes(genreId)) {
      setExcludedGenres(excludedGenres.filter((id) => id !== genreId));
    } else {
      setExcludedGenres([...excludedGenres, genreId]);
    }
  };

  const isGenreDisabled = (genreId: number) => {
    return selectedGenres.includes(genreId);
  };

  const handleGetRecommendation = async () => {
    if (selectedGenres.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const recommendation = await client.RECOMMEND_MOVIE({
        includeGenreIds: selectedGenres,
        excludeGenreIds: excludedGenres,
      });
      setRecommendation(recommendation);
      setShowGenres(false);
    } catch (err) {
      setError("Erro ao buscar recomendação: " + err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewRecommendation = () => {
    setRecommendation(null);
    setShowGenres(true);
    setShowVideo(false);
    setError(null);
  };

  const handleGetReviews = async () => {
    if (!recommendation) {
      return;
    }

    setReviewsLoading(true);
    setReviewsError(null);
    setShowReviewsModal(true);

    try {
      const reviewsData = await client.GET_MOVIE_REVIEWS({
        movieId: recommendation.movieId,
      });
      setReviews(reviewsData);
    } catch (err) {
      setReviewsError(
        err instanceof Error ? err.message : "Erro ao buscar reviews"
      );
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleCloseReviewsModal = () => {
    setShowReviewsModal(false);
    setReviews(null);
    setReviewsError(null);
  };

  const handleOpenHistoryModal = async () => {
    setShowHistoryModal(true);
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const [recommendedData, watchedData] = await Promise.all([
        client.GET_RECOMMENDED_MOVIES(),
        client.GET_WATCHED_MOVIES(),
      ]);

      // Ordenar por data de criação (mais recentes primeiro)
      setRecommendedMovies(sortMoviesByDate(recommendedData.movies));
      setWatchedMovies(sortMoviesByDate(watchedData.movies));
    } catch (err) {
      setHistoryError(
        err instanceof Error ? err.message : "Erro ao carregar histórico"
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false);
    setRecommendedMovies([]);
    setWatchedMovies([]);
    setHistoryError(null);
  };

  const handleAddToWatched = async (
    movie: RecommendedMovie | MovieRecommendation
  ) => {
    try {
      const genres = "genres" in movie && movie.genres ? movie.genres : [];
      const poster = "posterUrl" in movie ? movie.posterUrl : movie.poster;

      await client.ADD_WATCHED_MOVIE({
        movieId: movie.movieId,
        title: movie.title,
        poster: poster || undefined,
        genres: Array.isArray(genres) ? genres : [genres],
      });

      // Recarregar lista de filmes assistidos e ordenar
      const watchedData = await client.GET_WATCHED_MOVIES();
      setWatchedMovies(sortMoviesByDate(watchedData.movies));
    } catch (err) {
      console.error("Erro ao adicionar filme assistido:", err);
    }
  };

  const handleRemoveFromWatched = async (movieId: number) => {
    try {
      await client.REMOVE_WATCHED_MOVIE({ movieId });

      // Recarregar lista de filmes assistidos e ordenar
      const watchedData = await client.GET_WATCHED_MOVIES();
      setWatchedMovies(sortMoviesByDate(watchedData.movies));
    } catch (err) {
      console.error("Erro ao remover filme assistido:", err);
    }
  };

  const isMovieWatched = (movieId: number) => {
    return watchedMovies.some((movie) => movie.movieId === movieId);
  };

  const handleOpenSuggestionModal = async () => {
    setShowSuggestionModal(true);
    setSuggestionLoading(false); // Não iniciar loading automaticamente
    setSuggestionError(null);
    setGenreSuggestion(null);
  };

  const handleCloseSuggestionModal = () => {
    setShowSuggestionModal(false);
    setGenreSuggestion(null);
    setSuggestionError(null);
  };

  const handleGetGenreSuggestion = async (preference: "comfort" | "new") => {
    setSuggestionLoading(true);
    setSuggestionError(null);

    try {
      const suggestion = await client.SUGGEST_GENRES({ preference });
      setGenreSuggestion(suggestion);
    } catch (err) {
      setSuggestionError(
        err instanceof Error ? err.message : "Erro ao gerar sugestão"
      );
    } finally {
      setSuggestionLoading(false);
    }
  };

  const handleUseSuggestedGenres = (
    suggestedGenres: { id: number; name: string; reason: string }[]
  ) => {
    setSelectedGenres(suggestedGenres.map((g) => g.id));
    setExcludedGenres([]);
    setShowSuggestionModal(false);
    setShowGenres(false);
  };

  const formatGenres = (genresString: string | null): string => {
    if (!genresString) return "";

    try {
      const parsedGenres = JSON.parse(genresString);
      return Array.isArray(parsedGenres)
        ? parsedGenres.join(", ")
        : genresString;
    } catch {
      return genresString;
    }
  };

  const sortMoviesByDate = <T extends { createdAt: string }>(
    movies: T[]
  ): T[] => {
    return movies.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1e293b",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div>Buscando...</div>
      </div>
    );
  }

  if (genresLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1e293b",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div>Carregando gêneros...</div>
      </div>
    );
  }

  if (genresError) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1e293b",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2>Erro ao carregar gêneros</h2>
          <p>{genresError}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1e293b",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2>Erro ao buscar recomendação</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // View de recomendação de filme
  if (!showGenres && recommendation) {
    return (
      <>
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#1e293b",
            color: "white",
            fontFamily: "Arial, sans-serif",
            padding: "20px",
          }}
        >
          <div
            style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "30px",
              }}
            >
              <h1 style={{ margin: 0 }}>Filme Recomendado</h1>
              <button
                onClick={handleOpenHistoryModal}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                📚 Histórico
              </button>
            </div>

            {recommendation.posterUrl && (
              <img
                src={recommendation.posterUrl}
                alt={recommendation.title}
                style={{
                  maxWidth: "300px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                }}
              />
            )}

            <h2 style={{ marginBottom: "15px", fontSize: "24px" }}>
              {recommendation.title}
            </h2>

            {/* Seção de Gêneros */}
            {recommendation.genres && recommendation.genres.length > 0 && (
              <div style={{ marginBottom: "20px", textAlign: "left" }}>
                <h4
                  style={{
                    color: "#94a3b8",
                    marginBottom: "10px",
                    fontSize: "16px",
                  }}
                >
                  🏷️ Gêneros
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {recommendation.genres.map((genre, index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor: "#3b82f6",
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: "15px",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p
              style={{
                color: "#94a3b8",
                lineHeight: "1.6",
                marginBottom: "30px",
                textAlign: "left",
              }}
            >
              {recommendation.overview}
            </p>

            {/* Botão Ver Reviews */}
            <div style={{ marginBottom: "30px", textAlign: "center" }}>
              <button
                onClick={handleGetReviews}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#8b5cf6",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginBottom: "20px",
                }}
              >
                📝 Ver Reviews
              </button>

              {/* Botão Adicionar/Remover da Lista de Assistidos */}
              <div style={{ marginBottom: "20px" }}>
                {isMovieWatched(recommendation.movieId) ? (
                  <button
                    onClick={() =>
                      handleRemoveFromWatched(recommendation.movieId)
                    }
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    ❌ Remover dos Assistidos
                  </button>
                ) : (
                  <button
                    onClick={() => handleAddToWatched(recommendation)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    ✅ Marcar como Assistido
                  </button>
                )}
              </div>
            </div>

            {/* Seção de Vídeos */}
            {recommendation.videos && recommendation.videos.length > 0 && (
              <div style={{ marginBottom: "30px", textAlign: "left" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "15px",
                  }}
                >
                  <h3 style={{ color: "#e2e8f0", margin: 0 }}>🎬 Trailer</h3>
                  <button
                    onClick={() => setShowVideo(!showVideo)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: showVideo ? "#ef4444" : "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    {showVideo ? "Ocultar Trailer" : "Ver Trailer"}
                  </button>
                </div>

                {showVideo && (
                  <div
                    style={{
                      position: "relative",
                      paddingBottom: "56.25%",
                      height: 0,
                    }}
                  >
                    <iframe
                      src={`https://www.youtube.com/embed/${recommendation.videos[0].key}`}
                      title={recommendation.videos[0].name}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        borderRadius: "10px",
                      }}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {!showVideo && (
                  <div
                    style={{
                      padding: "10px",
                      backgroundColor: "#374151",
                      borderRadius: "5px",
                      color: "#9ca3af",
                      fontSize: "14px",
                    }}
                  >
                    💡 Clique em "Ver Trailer" para assistir ao trailer do filme
                  </div>
                )}
              </div>
            )}

            {/* Seção de Provedores de Streaming */}
            {recommendation.watchProviders && (
              <div style={{ marginBottom: "30px", textAlign: "left" }}>
                <h3 style={{ marginBottom: "15px", color: "#e2e8f0" }}>
                  📺 Onde Assistir
                </h3>

                {/* Streaming (Flatrate) */}
                {recommendation.watchProviders.flatrate &&
                  recommendation.watchProviders.flatrate.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <h4
                        style={{
                          color: "#94a3b8",
                          marginBottom: "10px",
                          fontSize: "16px",
                        }}
                      >
                        🟢 Streaming
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        {recommendation.watchProviders.flatrate.map(
                          (provider, index) => (
                            <div
                              key={index}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                backgroundColor: "#475569",
                                padding: "8px 12px",
                                borderRadius: "20px",
                                fontSize: "14px",
                              }}
                            >
                              {provider.logo_path && (
                                <img
                                  src={provider.logo_path}
                                  alt={provider.provider_name}
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "4px",
                                  }}
                                />
                              )}
                              <span>{provider.provider_name}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Aluguel (Rent) */}
                {recommendation.watchProviders.rent &&
                  recommendation.watchProviders.rent.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <h4
                        style={{
                          color: "#94a3b8",
                          marginBottom: "10px",
                          fontSize: "16px",
                        }}
                      >
                        🟡 Alugar
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        {recommendation.watchProviders.rent.map(
                          (provider, index) => (
                            <div
                              key={index}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                backgroundColor: "#475569",
                                padding: "8px 12px",
                                borderRadius: "20px",
                                fontSize: "14px",
                              }}
                            >
                              {provider.logo_path && (
                                <img
                                  src={provider.logo_path}
                                  alt={provider.provider_name}
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "4px",
                                  }}
                                />
                              )}
                              <span>{provider.provider_name}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Compra (Buy) */}
                {recommendation.watchProviders.buy &&
                  recommendation.watchProviders.buy.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <h4
                        style={{
                          color: "#94a3b8",
                          marginBottom: "10px",
                          fontSize: "16px",
                        }}
                      >
                        🔵 Comprar
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        {recommendation.watchProviders.buy.map(
                          (provider, index) => (
                            <div
                              key={index}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                backgroundColor: "#475569",
                                padding: "8px 12px",
                                borderRadius: "20px",
                                fontSize: "14px",
                              }}
                            >
                              {provider.logo_path && (
                                <img
                                  src={provider.logo_path}
                                  alt={provider.provider_name}
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "4px",
                                  }}
                                />
                              )}
                              <span>{provider.provider_name}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Botão Nova Recomendação */}
            <button
              onClick={handleNewRecommendation}
              style={{
                padding: "12px 24px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              Nova Recomendação
            </button>
          </div>
        </div>

        {/* Modal de Reviews como overlay */}
        {showReviewsModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
          >
            <div
              style={{
                backgroundColor: "#1e293b",
                borderRadius: "10px",
                padding: "30px",
                maxWidth: "600px",
                width: "100%",
                maxHeight: "80vh",
                overflowY: "auto",
                color: "white",
                position: "relative",
              }}
            >
              {/* Botão de fechar */}
              <button
                onClick={handleCloseReviewsModal}
                style={{
                  position: "absolute",
                  top: "15px",
                  right: "20px",
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "24px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ×
              </button>

              <h2 style={{ marginBottom: "20px", color: "#e2e8f0" }}>
                📝 Análise de Reviews
              </h2>

              {reviewsLoading && (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div style={{ color: "#94a3b8" }}>Analisando reviews...</div>
                </div>
              )}

              {reviewsError && (
                <div
                  style={{
                    backgroundColor: "#dc2626",
                    color: "white",
                    padding: "15px",
                    borderRadius: "5px",
                    marginBottom: "20px",
                  }}
                >
                  Erro: {reviewsError}
                </div>
              )}

              {reviews && !reviewsLoading && (
                <div>
                  {/* Sentimento */}
                  <div style={{ marginBottom: "20px" }}>
                    <h3 style={{ color: "#e2e8f0", marginBottom: "10px" }}>
                      Sentimento Geral
                    </h3>
                    <div
                      style={{
                        display: "inline-block",
                        padding: "6px 12px",
                        borderRadius: "15px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        backgroundColor:
                          reviews.sentiment === "positivo"
                            ? "#10b981"
                            : reviews.sentiment === "negativo"
                              ? "#ef4444"
                              : reviews.sentiment === "misto"
                                ? "#f59e0b"
                                : "#6b7280",
                      }}
                    >
                      {reviews.sentiment.charAt(0).toUpperCase() +
                        reviews.sentiment.slice(1)}
                    </div>
                  </div>

                  {/* Resumo */}
                  <div style={{ marginBottom: "20px" }}>
                    <h3 style={{ color: "#e2e8f0", marginBottom: "10px" }}>
                      Resumo
                    </h3>
                    <p style={{ color: "#94a3b8", lineHeight: "1.6" }}>
                      {reviews.summary}
                    </p>
                  </div>

                  {/* Pontos Principais */}
                  <div>
                    <h3 style={{ color: "#e2e8f0", marginBottom: "10px" }}>
                      Pontos Principais
                    </h3>
                    <ul style={{ color: "#94a3b8", paddingLeft: "20px" }}>
                      {reviews.keyPoints.map((point, index) => (
                        <li
                          key={index}
                          style={{ marginBottom: "8px", lineHeight: "1.5" }}
                        >
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  // Modal lateral de histórico
  if (showHistoryModal) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: "#1e293b",
            width: "400px",
            height: "100vh",
            overflowY: "auto",
            color: "white",
            position: "relative",
            padding: "20px",
          }}
        >
          {/* Botão de fechar */}
          <button
            onClick={handleCloseHistoryModal}
            style={{
              position: "absolute",
              top: "15px",
              right: "20px",
              backgroundColor: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: "24px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ×
          </button>

          <h2 style={{ marginBottom: "20px", color: "#e2e8f0" }}>
            📚 Histórico de Filmes
          </h2>

          {historyLoading && (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ color: "#94a3b8" }}>Carregando histórico...</div>
            </div>
          )}

          {historyError && (
            <div
              style={{
                backgroundColor: "#dc2626",
                color: "white",
                padding: "15px",
                borderRadius: "5px",
                marginBottom: "20px",
              }}
            >
              Erro: {historyError}
            </div>
          )}

          {!historyLoading && !historyError && (
            <div>
              {/* Filmes Assistidos */}
              <div style={{ marginBottom: "30px" }}>
                <h3
                  style={{
                    color: "#e2e8f0",
                    marginBottom: "15px",
                    fontSize: "18px",
                  }}
                >
                  ✅ Filmes Assistidos ({watchedMovies.length})
                </h3>
                {watchedMovies.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                    Nenhum filme assistido ainda.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {watchedMovies.map((movie) => (
                      <div
                        key={movie.id}
                        style={{
                          backgroundColor: "#374151",
                          padding: "12px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        {movie.poster && (
                          <img
                            src={movie.poster}
                            alt={movie.title}
                            style={{
                              width: "40px",
                              height: "60px",
                              borderRadius: "4px",
                              objectFit: "cover",
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <h4
                            style={{
                              margin: 0,
                              fontSize: "14px",
                              color: "#e2e8f0",
                            }}
                          >
                            {movie.title}
                          </h4>
                          {movie.genres && (
                            <p
                              style={{
                                margin: "4px 0 0 0",
                                fontSize: "12px",
                                color: "#94a3b8",
                              }}
                            >
                              {formatGenres(movie.genres)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveFromWatched(movie.movieId)}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "10px",
                          }}
                        >
                          ❌
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Filmes Recomendados */}
              <div>
                <h3
                  style={{
                    color: "#e2e8f0",
                    marginBottom: "15px",
                    fontSize: "18px",
                  }}
                >
                  🎬 Filmes Recomendados ({recommendedMovies.length})
                </h3>
                {recommendedMovies.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                    Nenhum filme recomendado ainda.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {recommendedMovies.map((movie) => (
                      <div
                        key={movie.id}
                        style={{
                          backgroundColor: "#374151",
                          padding: "12px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        {movie.poster && (
                          <img
                            src={movie.poster}
                            alt={movie.title}
                            style={{
                              width: "40px",
                              height: "60px",
                              borderRadius: "4px",
                              objectFit: "cover",
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <h4
                            style={{
                              margin: 0,
                              fontSize: "14px",
                              color: "#e2e8f0",
                            }}
                          >
                            {movie.title}
                          </h4>
                          {movie.genres && (
                            <p
                              style={{
                                margin: "4px 0 0 0",
                                fontSize: "12px",
                                color: "#94a3b8",
                              }}
                            >
                              {formatGenres(movie.genres)}
                            </p>
                          )}
                        </div>
                        {isMovieWatched(movie.movieId) ? (
                          <button
                            onClick={() =>
                              handleRemoveFromWatched(movie.movieId)
                            }
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "#ef4444",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "10px",
                            }}
                          >
                            ❌
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddToWatched(movie)}
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "#10b981",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "10px",
                            }}
                          >
                            ✅
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Modal de sugestão de gêneros
  if (showSuggestionModal) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "#1e293b",
            borderRadius: "10px",
            padding: "30px",
            maxWidth: "600px",
            width: "100%",
            maxHeight: "80vh",
            overflowY: "auto",
            color: "white",
            position: "relative",
          }}
        >
          {/* Botão de fechar */}
          <button
            onClick={handleCloseSuggestionModal}
            style={{
              position: "absolute",
              top: "15px",
              right: "20px",
              backgroundColor: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: "24px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ×
          </button>

          <h2 style={{ marginBottom: "20px", color: "#e2e8f0" }}>
            🎯 Sugestão de Gêneros
          </h2>

          {!genreSuggestion && !suggestionLoading && (
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  color: "#94a3b8",
                  marginBottom: "20px",
                  fontSize: "16px",
                }}
              >
                Escolha o tipo de experiência que você quer:
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  marginBottom: "30px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#374151",
                    padding: "20px",
                    borderRadius: "10px",
                    border: "2px solid #10b981",
                  }}
                >
                  <h3
                    style={{
                      color: "#10b981",
                      marginBottom: "10px",
                      fontSize: "18px",
                    }}
                  >
                    🏠 Zona de Conforto
                  </h3>
                  <p
                    style={{
                      color: "#94a3b8",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      marginBottom: "15px",
                    }}
                  >
                    Analisamos seus filmes assistidos e sugerimos gêneros
                    similares aos que você mais gosta. Ideal para quando você
                    quer algo familiar e confiável.
                  </p>
                  <button
                    onClick={() => handleGetGenreSuggestion("comfort")}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "bold",
                      width: "100%",
                    }}
                  >
                    🏠 Escolher Zona de Conforto
                  </button>
                </div>

                <div
                  style={{
                    backgroundColor: "#374151",
                    padding: "20px",
                    borderRadius: "10px",
                    border: "2px solid #8b5cf6",
                  }}
                >
                  <h3
                    style={{
                      color: "#8b5cf6",
                      marginBottom: "10px",
                      fontSize: "18px",
                    }}
                  >
                    🌟 Experiência Nova
                  </h3>
                  <p
                    style={{
                      color: "#94a3b8",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      marginBottom: "15px",
                    }}
                  >
                    Descubra gêneros diferentes dos que você costuma assistir.
                    Perfeito para expandir seus horizontes cinematográficos e
                    encontrar novas paixões.
                  </p>
                  <button
                    onClick={() => handleGetGenreSuggestion("new")}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#8b5cf6",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "bold",
                      width: "100%",
                    }}
                  >
                    🌟 Escolher Experiência Nova
                  </button>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#1f2937",
                  padding: "15px",
                  borderRadius: "8px",
                  border: "1px solid #374151",
                }}
              >
                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: "13px",
                    margin: 0,
                    textAlign: "left",
                  }}
                >
                  <strong>💡 Dica:</strong> Nossa IA analisa todos os filmes que
                  você marcou como "assistidos" para entender suas preferências
                  e fazer sugestões personalizadas.
                </p>
              </div>
            </div>
          )}

          {suggestionLoading && (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ color: "#94a3b8" }}>
                Analisando seus filmes assistidos...
              </div>
            </div>
          )}

          {suggestionError && (
            <div
              style={{
                backgroundColor: "#dc2626",
                color: "white",
                padding: "15px",
                borderRadius: "5px",
                marginBottom: "20px",
              }}
            >
              Erro: {suggestionError}
            </div>
          )}

          {genreSuggestion && !suggestionLoading && (
            <div>
              {/* Análise */}
              <div style={{ marginBottom: "25px" }}>
                <h3 style={{ color: "#e2e8f0", marginBottom: "10px" }}>
                  📊 Análise
                </h3>
                <p style={{ color: "#94a3b8", lineHeight: "1.6" }}>
                  {genreSuggestion.analysis}
                </p>
              </div>

              {/* Gêneros Sugeridos */}
              <div style={{ marginBottom: "25px" }}>
                <h3 style={{ color: "#e2e8f0", marginBottom: "15px" }}>
                  🎬 Gêneros Sugeridos
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {genreSuggestion.suggestedGenres.map((genre, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: "#374151",
                        padding: "15px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "15px",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "#3b82f6",
                          color: "white",
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          fontWeight: "bold",
                        }}
                      >
                        {index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "16px",
                            color: "#e2e8f0",
                          }}
                        >
                          {genre.name}
                        </h4>
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: "14px",
                            color: "#94a3b8",
                          }}
                        >
                          {genre.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botões de Ação */}
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={() =>
                    handleUseSuggestedGenres(genreSuggestion.suggestedGenres)
                  }
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  ✅ Usar Estes Gêneros
                </button>

                <button
                  onClick={handleCloseSuggestionModal}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // View de seleção de gêneros
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#1e293b",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <h1 style={{ margin: 0 }}>Which Movie?</h1>
          <button
            onClick={handleOpenHistoryModal}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            📚 Histórico
          </button>
        </div>

        <div style={{ marginBottom: "30px" }}>
          <h2>Gêneros que você quer (máximo 3):</h2>
          <p style={{ color: "#94a3b8", marginBottom: "15px" }}>
            Selecione até 3 gêneros que você gostaria de ver em um filme
            recomendado
          </p>

          {/* Botão de Sugestão */}
          <div style={{ marginBottom: "20px", textAlign: "center" }}>
            <button
              onClick={handleOpenSuggestionModal}
              style={{
                padding: "10px 20px",
                backgroundColor: "#f59e0b",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              🎯 Sugerir Gêneros
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {genres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => handleIncludeGenre(genre.id)}
                disabled={
                  selectedGenres.length >= 3 &&
                  !selectedGenres.includes(genre.id)
                }
                style={{
                  padding: "8px 16px",
                  backgroundColor: selectedGenres.includes(genre.id)
                    ? "#3b82f6"
                    : "#475569",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  cursor:
                    selectedGenres.includes(genre.id) ||
                    selectedGenres.length < 3
                      ? "pointer"
                      : "not-allowed",
                  opacity:
                    selectedGenres.length >= 3 &&
                    !selectedGenres.includes(genre.id)
                      ? 0.5
                      : 1,
                  fontSize: "14px",
                }}
              >
                {genre.name}
              </button>
            ))}
          </div>
          <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "10px" }}>
            Selecionados: {selectedGenres.length}/3
          </p>
        </div>

        <div style={{ marginBottom: "30px" }}>
          <h2>Gêneros que você NÃO quer (opcional):</h2>
          <p style={{ color: "#94a3b8", marginBottom: "15px" }}>
            Selecione gêneros que você prefere evitar
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {genres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => handleExcludeGenre(genre.id)}
                disabled={isGenreDisabled(genre.id)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: excludedGenres.includes(genre.id)
                    ? "#ef4444"
                    : "#475569",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  cursor: isGenreDisabled(genre.id) ? "not-allowed" : "pointer",
                  opacity: isGenreDisabled(genre.id) ? 0.5 : 1,
                  fontSize: "14px",
                }}
              >
                {genre.name}
              </button>
            ))}
          </div>
          <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "10px" }}>
            Excluídos: {excludedGenres.length}
          </p>
        </div>

        {error && (
          <div
            style={{
              color: "#ef4444",
              backgroundColor: "#7f1d1d",
              padding: "10px",
              borderRadius: "5px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            Erro ao buscar recomendação: {error}
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          <button
            onClick={handleGetRecommendation}
            disabled={selectedGenres.length === 0 || loading}
            style={{
              padding: "12px 24px",
              backgroundColor:
                selectedGenres.length > 0 && !loading ? "#3b82f6" : "#475569",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor:
                selectedGenres.length > 0 && !loading
                  ? "pointer"
                  : "not-allowed",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            {loading ? "Buscando..." : "Buscar Recomendação"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
