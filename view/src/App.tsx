import { useState, useEffect } from "react";
import { client, type MovieAnalysis } from "./lib/rpc";
import type {
  MovieRecommendation,
  MovieReviews,
  RecommendedMovie,
  WatchedMovie,
  GenreSuggestion,
} from "./lib/rpc";
import {
  Button,
  Card,
  Typography,
  Box,
  Modal,
  IconButton,
  Chip,
  Rating,
  AppBar,
  Toolbar,
  Container,
  Paper,
  List,
  ListItem,
  ListItemText,
  Avatar,
  LinearProgress,
  CircularProgress,
  Alert,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import {
  Movie as MovieIcon,
  Star as StarIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  AutoAwesome as AutoAwesomeIcon,
  Home as HomeIcon,
  Psychology as PsychologyIcon,
  Explore as ExploreIcon,
  Visibility as VisibilityIcon,
  Recommend as RecommendIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LibraryBooks as LibraryBooksIcon,
} from "@mui/icons-material";

// Tema escuro personalizado
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#60a5fa", // Azul mais vibrante para tema escuro
    },
    secondary: {
      main: "#a78bfa", // Roxo mais vibrante para tema escuro
    },
    success: {
      main: "#34d399", // Verde mais vibrante para tema escuro
    },
    error: {
      main: "#f87171", // Vermelho mais vibrante para tema escuro
    },
    warning: {
      main: "#fbbf24", // Amarelo mais vibrante para tema escuro
    },
    background: {
      default: "#0f172a", // Slate 900 - fundo principal escuro
      paper: "#1e293b", // Slate 800 - fundo de cards escuro
    },
    text: {
      primary: "#f1f5f9", // Slate 100 - texto principal
      secondary: "#cbd5e1", // Slate 300 - texto secundário
    },
    divider: "#334155", // Slate 700 - divisores
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 700,
      color: "#f1f5f9",
    },
    h4: {
      fontWeight: 600,
      color: "#f1f5f9",
    },
    h5: {
      fontWeight: 600,
      color: "#f1f5f9",
    },
    h6: {
      fontWeight: 600,
      color: "#f1f5f9",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
          fontWeight: 600,
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: "#1e293b",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
          border: "1px solid #334155",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
          "&:hover": {
            transform: "scale(1.05)",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#1e293b",
          borderBottom: "1px solid #334155",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#1e293b",
          border: "1px solid #334155",
        },
      },
    },
    MuiModal: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
        },
      },
    },
    MuiRating: {
      styleOverrides: {
        root: {
          "& .MuiRating-iconFilled": {
            color: "#fbbf24",
          },
          "& .MuiRating-iconHover": {
            color: "#f59e0b",
          },
        },
      },
    },
  },
});

// Hook para buscar gêneros de filmes
const useMovieGenres = () => {
  const [genres, setGenres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const data = await client.LIST_MOVIE_GENRES();
        setGenres(data.genres);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar gêneros"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  return { genres, loading, error };
};

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
  const [addingToWatchedLoading, setAddingToWatchedLoading] = useState(false);
  const [removingFromWatchedLoading, setRemovingFromWatchedLoading] = useState<
    number | null
  >(null);
  const [ratingLoading, setRatingLoading] = useState<number | null>(null);
  const [historyView, setHistoryView] = useState<"watched" | "recommended">(
    "watched"
  );
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  const [analysisData, setAnalysisData] = useState<MovieAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

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

  const handleOpenAnalysisModal = async () => {
    setShowAnalysisModal(true);
    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisData(null);

    try {
      const result = await client.ANALYZE_WATCHED_MOVIES();
      setAnalysisData(result);
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : "Erro ao analisar filmes"
      );
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleCloseAnalysisModal = () => {
    setShowAnalysisModal(false);
    setAnalysisData(null);
    setAnalysisError(null);
  };

  const handleAddToWatched = async (
    movie: RecommendedMovie | MovieRecommendation
  ) => {
    setAddingToWatchedLoading(true);
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
      alert(
        "Erro ao adicionar filme assistido: " +
          (err instanceof Error ? err.message : "Erro desconhecido")
      );
    } finally {
      setAddingToWatchedLoading(false);
    }
  };

  const handleRemoveFromWatched = async (movieId: number) => {
    setRemovingFromWatchedLoading(movieId);
    try {
      await client.REMOVE_WATCHED_MOVIE({ movieId });

      // Recarregar lista de filmes assistidos e ordenar
      const watchedData = await client.GET_WATCHED_MOVIES();
      setWatchedMovies(sortMoviesByDate(watchedData.movies));
    } catch (err) {
      console.error("Erro ao remover filme assistido:", err);
    } finally {
      setRemovingFromWatchedLoading(null);
    }
  };

  const handleUpdateRating = async (movieId: number, rating: number) => {
    setRatingLoading(movieId);
    try {
      await client.UPDATE_MOVIE_RATING({ movieId, rating });

      // Recarregar lista de filmes assistidos e ordenar
      const watchedData = await client.GET_WATCHED_MOVIES();
      setWatchedMovies(sortMoviesByDate(watchedData.movies));
    } catch (err) {
      console.error("Erro ao atualizar avaliação:", err);
      alert(
        "Erro ao atualizar avaliação: " +
          (err instanceof Error ? err.message : "Erro desconhecido")
      );
    } finally {
      setRatingLoading(null);
    }
  };

  const isMovieWatched = (movieId: number) => {
    return watchedMovies.some((movie) => movie.movieId === movieId);
  };

  const StarRating = ({
    rating,
    onRatingChange,
    movieId,
  }: {
    rating: number | null;
    onRatingChange: (rating: number) => void;
    movieId: number;
  }) => {
    const isLoading = ratingLoading === movieId;

    return (
      <Box display="flex" alignItems="center" gap={1}>
        {isLoading ? (
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Salvando...
            </Typography>
          </Box>
        ) : (
          <>
            <Rating
              value={rating || 0}
              onChange={(_, newValue) => {
                if (newValue !== null) {
                  onRatingChange(newValue);
                }
              }}
              size="large"
              sx={{
                "& .MuiRating-iconFilled": {
                  color: "#fbbf24",
                },
                "& .MuiRating-iconHover": {
                  color: "#f59e0b",
                },
              }}
            />
            {rating && (
              <Typography variant="body2" color="text.secondary">
                {rating}/5
              </Typography>
            )}
          </>
        )}
      </Box>
    );
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

  const formatGenres = (genresInput: string | string[] | null): string[] => {
    if (!genresInput) return [];

    // Se já é um array, retorna diretamente
    if (Array.isArray(genresInput)) {
      return genresInput;
    }

    // Se é uma string, tenta fazer parse
    try {
      const parsedGenres = JSON.parse(genresInput);
      return Array.isArray(parsedGenres) ? parsedGenres : [genresInput];
    } catch {
      // Se não consegue fazer parse, pode ser uma string concatenada
      // Tenta dividir por vírgulas ou espaços
      if (typeof genresInput === "string") {
        // Remove espaços extras e divide por vírgulas
        return genresInput
          .split(",")
          .map((genre) => genre.trim())
          .filter((genre) => genre.length > 0);
      }
      return [genresInput];
    }
  };

  const renderGenres = (genres: string | string[] | null) => {
    if (!genres) return null;

    const formattedGenres = formatGenres(genres);
    console.log("Genres:", genres, "Formatted:", formattedGenres);

    return (
      <Box sx={{ mb: 1 }}>
        <Box display="flex" flexWrap="wrap" gap={0.5}>
          {formattedGenres.map((genre, index) => (
            <Chip
              key={index}
              label={genre}
              size="small"
              variant="outlined"
              sx={{
                height: 20,
                fontSize: "0.7rem",
                backgroundColor: "rgba(51, 65, 85, 0.3)",
                borderColor: "rgba(148, 163, 184, 0.3)",
                color: "text.secondary",
                "& .MuiChip-label": {
                  px: 1,
                },
              }}
            />
          ))}
        </Box>
      </Box>
    );
  };

  const sortMoviesByDate = <T extends { createdAt: string }>(
    movies: T[]
  ): T[] => {
    return movies.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  // Loading states
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box
          minHeight="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="background.default"
        >
          <Box textAlign="center">
            <LinearProgress sx={{ width: 200, mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Buscando...
            </Typography>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  if (genresLoading) {
    return (
      <ThemeProvider theme={theme}>
        <Box
          minHeight="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="background.default"
        >
          <Box textAlign="center">
            <LinearProgress sx={{ width: 200, mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Carregando gêneros...
            </Typography>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  if (genresError) {
    return (
      <ThemeProvider theme={theme}>
        <Box
          minHeight="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="background.default"
        >
          <Alert severity="error" sx={{ maxWidth: 400 }}>
            <Typography variant="h6" gutterBottom>
              Erro ao carregar gêneros
            </Typography>
            <Typography>{genresError}</Typography>
          </Alert>
        </Box>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <Box
          minHeight="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="background.default"
        >
          <Alert severity="error" sx={{ maxWidth: 400 }}>
            <Typography variant="h6" gutterBottom>
              Erro ao buscar recomendação
            </Typography>
            <Typography>{error}</Typography>
          </Alert>
        </Box>
      </ThemeProvider>
    );
  }

  // View de recomendação de filme
  if (!showGenres && recommendation) {
    return (
      <ThemeProvider theme={theme}>
        <Box minHeight="100vh" bgcolor="background.default" sx={{ p: 2 }}>
          <Container maxWidth="md">
            <AppBar position="static" sx={{ mb: 3 }}>
              <Toolbar>
                <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                  <MovieIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                  Filme Recomendado
                </Typography>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleOpenHistoryModal}
                  startIcon={<HistoryIcon />}
                >
                  Histórico
                </Button>
              </Toolbar>
            </AppBar>

            <Card sx={{ p: 3, textAlign: "center" }}>
              {recommendation.posterUrl && (
                <Box sx={{ mb: 3 }}>
                  <img
                    src={recommendation.posterUrl}
                    alt={recommendation.title}
                    style={{
                      maxWidth: "300px",
                      borderRadius: "16px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                    }}
                  />
                </Box>
              )}

              <Typography variant="h3" gutterBottom>
                {recommendation.title}
              </Typography>

              {/* Seção de Gêneros */}
              {recommendation.genres && recommendation.genres.length > 0 && (
                <Box sx={{ mb: 3, textAlign: "left" }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    🏷️ Gêneros
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {recommendation.genres.map((genre, index) => (
                      <Chip
                        key={index}
                        label={genre}
                        color="primary"
                        size="small"
                        sx={{
                          "&:hover": {
                            transform: "scale(1.05)",
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3, textAlign: "left", lineHeight: 1.6 }}
              >
                {recommendation.overview}
              </Typography>

              {/* Botão Ver Reviews */}
              <Box sx={{ mb: 3, textAlign: "center" }}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={handleGetReviews}
                  startIcon={<StarIcon />}
                  sx={{
                    mb: 2,
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "1.1rem",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: 4,
                    },
                  }}
                >
                  Ver Reviews
                </Button>

                {/* Botão Adicionar/Remover da Lista de Assistidos */}
                <Box sx={{ mb: 2 }}>
                  {isMovieWatched(recommendation.movieId) ? (
                    <Box>
                      <Button
                        variant="contained"
                        color="error"
                        size="large"
                        onClick={() =>
                          handleRemoveFromWatched(recommendation.movieId)
                        }
                        disabled={
                          removingFromWatchedLoading === recommendation.movieId
                        }
                        startIcon={
                          removingFromWatchedLoading ===
                          recommendation.movieId ? (
                            <CircularProgress size={20} />
                          ) : (
                            <RemoveIcon />
                          )
                        }
                        sx={{
                          mb: 2,
                          px: 3,
                          py: 1.5,
                          borderRadius: 2,
                          textTransform: "none",
                          fontSize: "1.1rem",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: 4,
                          },
                        }}
                      >
                        {removingFromWatchedLoading === recommendation.movieId
                          ? "Removendo..."
                          : "Remover dos Assistidos"}
                      </Button>

                      {/* Estrelas para avaliação - Centralizadas */}
                      <Box
                        sx={{
                          mt: 3,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          variant="h6"
                          color="text.secondary"
                          gutterBottom
                        >
                          Como você avalia este filme?
                        </Typography>
                        <StarRating
                          rating={
                            watchedMovies.find(
                              (m) => m.movieId === recommendation.movieId
                            )?.rating || null
                          }
                          onRatingChange={(rating) =>
                            handleUpdateRating(recommendation.movieId, rating)
                          }
                          movieId={recommendation.movieId}
                        />
                      </Box>
                    </Box>
                  ) : (
                    <Button
                      variant="contained"
                      color="success"
                      size="large"
                      onClick={() => handleAddToWatched(recommendation)}
                      disabled={addingToWatchedLoading}
                      startIcon={<AddIcon />}
                      sx={{
                        px: 3,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: "none",
                        fontSize: "1.1rem",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: 4,
                        },
                      }}
                    >
                      {addingToWatchedLoading
                        ? "Adicionando..."
                        : "Marcar como Assistido"}
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Seção de Vídeos */}
              {recommendation.videos && recommendation.videos.length > 0 && (
                <Box sx={{ mb: 3, textAlign: "left" }}>
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={2}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="h5" sx={{ m: 0 }}>
                      🎬 Trailer
                    </Typography>
                    <Button
                      variant="contained"
                      color={showVideo ? "error" : "success"}
                      size="small"
                      onClick={() => setShowVideo(!showVideo)}
                      startIcon={showVideo ? <StopIcon /> : <PlayIcon />}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        "&:hover": {
                          transform: "translateY(-1px)",
                          boxShadow: 2,
                        },
                      }}
                    >
                      {showVideo ? "Ocultar Trailer" : "Ver Trailer"}
                    </Button>
                  </Box>

                  {showVideo && (
                    <Box
                      sx={{
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
                          borderRadius: "16px",
                        }}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </Box>
                  )}

                  {!showVideo && (
                    <Paper sx={{ p: 2, bgcolor: "rgba(51, 65, 85, 0.3)" }}>
                      <Typography variant="body2" color="text.secondary">
                        💡 Clique em "Ver Trailer" para assistir ao trailer do
                        filme
                      </Typography>
                    </Paper>
                  )}
                </Box>
              )}

              {/* Seção de Provedores de Streaming */}
              {recommendation.watchProviders && (
                <Box sx={{ mb: 3, textAlign: "left" }}>
                  <Typography variant="h5" gutterBottom>
                    📺 Onde Assistir
                  </Typography>

                  {/* Streaming (Flatrate) */}
                  {recommendation.watchProviders.flatrate &&
                    recommendation.watchProviders.flatrate.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="h6"
                          color="text.secondary"
                          gutterBottom
                        >
                          🟢 Streaming
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {recommendation.watchProviders.flatrate.map(
                            (provider, index) => (
                              <Chip
                                key={index}
                                label={provider.provider_name}
                                icon={
                                  provider.logo_path ? (
                                    <img
                                      src={provider.logo_path}
                                      alt={provider.provider_name}
                                      style={{
                                        width: "16px",
                                        height: "16px",
                                        borderRadius: "2px",
                                      }}
                                    />
                                  ) : undefined
                                }
                                sx={{
                                  backgroundColor: "rgba(34, 197, 94, 0.1)",
                                  border: "1px solid rgba(34, 197, 94, 0.3)",
                                  color: "#34d399",
                                  "&:hover": {
                                    backgroundColor: "rgba(34, 197, 94, 0.2)",
                                  },
                                }}
                              />
                            )
                          )}
                        </Box>
                      </Box>
                    )}

                  {/* Aluguel (Rent) */}
                  {recommendation.watchProviders.rent &&
                    recommendation.watchProviders.rent.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="h6"
                          color="text.secondary"
                          gutterBottom
                        >
                          🟡 Alugar
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {recommendation.watchProviders.rent.map(
                            (provider, index) => (
                              <Chip
                                key={index}
                                label={provider.provider_name}
                                icon={
                                  provider.logo_path ? (
                                    <img
                                      src={provider.logo_path}
                                      alt={provider.provider_name}
                                      style={{
                                        width: "16px",
                                        height: "16px",
                                        borderRadius: "2px",
                                      }}
                                    />
                                  ) : undefined
                                }
                                sx={{
                                  backgroundColor: "rgba(251, 191, 36, 0.1)",
                                  border: "1px solid rgba(251, 191, 36, 0.3)",
                                  color: "#fbbf24",
                                  "&:hover": {
                                    backgroundColor: "rgba(251, 191, 36, 0.2)",
                                  },
                                }}
                              />
                            )
                          )}
                        </Box>
                      </Box>
                    )}

                  {/* Compra (Buy) */}
                  {recommendation.watchProviders.buy &&
                    recommendation.watchProviders.buy.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="h6"
                          color="text.secondary"
                          gutterBottom
                        >
                          🔵 Comprar
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {recommendation.watchProviders.buy.map(
                            (provider, index) => (
                              <Chip
                                key={index}
                                label={provider.provider_name}
                                icon={
                                  provider.logo_path ? (
                                    <img
                                      src={provider.logo_path}
                                      alt={provider.provider_name}
                                      style={{
                                        width: "16px",
                                        height: "16px",
                                        borderRadius: "2px",
                                      }}
                                    />
                                  ) : undefined
                                }
                                sx={{
                                  backgroundColor: "rgba(96, 165, 250, 0.1)",
                                  border: "1px solid rgba(96, 165, 250, 0.3)",
                                  color: "#60a5fa",
                                  "&:hover": {
                                    backgroundColor: "rgba(96, 165, 250, 0.2)",
                                  },
                                }}
                              />
                            )
                          )}
                        </Box>
                      </Box>
                    )}
                </Box>
              )}

              {/* Botão Nova Recomendação */}
              <Box textAlign="center" sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleNewRecommendation}
                  startIcon={<MovieIcon />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "1.1rem",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: 4,
                    },
                  }}
                >
                  Nova Recomendação
                </Button>
              </Box>
            </Card>
          </Container>
        </Box>

        {/* Modal de Reviews como overlay */}
        {showReviewsModal && (
          <Modal
            open={showReviewsModal}
            onClose={handleCloseReviewsModal}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 2,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
            }}
          >
            <Paper
              sx={{
                maxWidth: 600,
                width: "100%",
                maxHeight: "80vh",
                overflow: "auto",
                position: "relative",
                p: 3,
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
              }}
            >
              <IconButton
                onClick={handleCloseReviewsModal}
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                }}
              >
                <CloseIcon />
              </IconButton>

              <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                📝 Análise de Reviews
              </Typography>

              {reviewsLoading && (
                <Box textAlign="center" py={4}>
                  <LinearProgress sx={{ width: 200, mx: "auto", mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Analisando reviews...
                  </Typography>
                </Box>
              )}

              {reviewsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Erro: {reviewsError}
                </Alert>
              )}

              {reviews && !reviewsLoading && (
                <Box>
                  {/* Sentimento */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Sentimento Geral
                    </Typography>
                    <Chip
                      label={
                        reviews.sentiment.charAt(0).toUpperCase() +
                        reviews.sentiment.slice(1)
                      }
                      color={
                        reviews.sentiment === "positivo"
                          ? "success"
                          : reviews.sentiment === "negativo"
                            ? "error"
                            : reviews.sentiment === "misto"
                              ? "warning"
                              : "default"
                      }
                      variant="filled"
                      sx={{ fontSize: "1rem", px: 2, py: 1 }}
                    />
                  </Box>

                  {/* Resumo */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Resumo
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ lineHeight: 1.6 }}
                    >
                      {reviews.summary}
                    </Typography>
                  </Box>

                  {/* Pontos Principais */}
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Pontos Principais
                    </Typography>
                    <List>
                      {reviews.keyPoints.map((point, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemText
                            primary={point}
                            sx={{
                              "& .MuiListItemText-primary": {
                                color: "text.secondary",
                                lineHeight: 1.5,
                              },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Box>
              )}
            </Paper>
          </Modal>
        )}
      </ThemeProvider>
    );
  }

  // Modal de sugestão de gêneros
  if (showSuggestionModal) {
    return (
      <ThemeProvider theme={theme}>
        <Modal
          open={showSuggestionModal}
          onClose={handleCloseSuggestionModal}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          }}
        >
          <Paper
            sx={{
              maxWidth: 600,
              width: "100%",
              maxHeight: "80vh",
              overflow: "auto",
              position: "relative",
              p: 3,
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
            }}
          >
            <IconButton
              onClick={handleCloseSuggestionModal}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
              }}
            >
              <CloseIcon />
            </IconButton>

            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
              <AutoAwesomeIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Sugestão de Gêneros
            </Typography>

            {!genreSuggestion && !suggestionLoading && (
              <Box textAlign="center">
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Escolha o tipo de experiência que você quer:
                </Typography>

                <Box
                  display="flex"
                  flexDirection={{ xs: "column", md: "row" }}
                  gap={2}
                  sx={{ mt: 2 }}
                >
                  <Box flex={1} sx={{ display: "flex" }}>
                    <Card
                      sx={{
                        p: 3,
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minHeight: 200,
                        width: "100%",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: 4,
                        },
                      }}
                      onClick={() => handleGetGenreSuggestion("comfort")}
                    >
                      <Box>
                        <HomeIcon
                          sx={{ fontSize: 48, color: "success.main", mb: 2 }}
                        />
                        <Typography variant="h6" gutterBottom>
                          Zona de Conforto
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Analisamos seus filmes assistidos e sugerimos gêneros
                          similares aos que você mais gosta. Ideal para quando
                          você quer algo familiar e confiável.
                        </Typography>
                      </Box>
                    </Card>
                  </Box>

                  <Box flex={1} sx={{ display: "flex" }}>
                    <Card
                      sx={{
                        p: 3,
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minHeight: 200,
                        width: "100%",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: 4,
                        },
                      }}
                      onClick={() => handleGetGenreSuggestion("new")}
                    >
                      <Box>
                        <ExploreIcon
                          sx={{ fontSize: 48, color: "secondary.main", mb: 2 }}
                        />
                        <Typography variant="h6" gutterBottom>
                          Experiência Nova
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Descubra gêneros diferentes dos que você costuma
                          assistir. Perfeito para expandir seus horizontes
                          cinematográficos e encontrar novas paixões.
                        </Typography>
                      </Box>
                    </Card>
                  </Box>
                </Box>

                <Paper sx={{ p: 2, mt: 3, bgcolor: "rgba(51, 65, 85, 0.3)" }}>
                  <Typography variant="body2" color="text.secondary">
                    <PsychologyIcon
                      sx={{ mr: 1, verticalAlign: "middle", fontSize: 16 }}
                    />
                    <strong>Dica:</strong> Nossa IA analisa todos os filmes que
                    você marcou como "assistidos" para entender suas
                    preferências e fazer sugestões personalizadas.
                  </Typography>
                </Paper>
              </Box>
            )}

            {suggestionLoading && (
              <Box textAlign="center" py={4}>
                <LinearProgress sx={{ width: 200, mx: "auto", mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Analisando seus filmes assistidos...
                </Typography>
              </Box>
            )}

            {suggestionError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Erro: {suggestionError}
              </Alert>
            )}

            {genreSuggestion && !suggestionLoading && (
              <Box>
                <Typography variant="h5" gutterBottom>
                  📊 Análise
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {genreSuggestion.analysis}
                </Typography>

                <Typography variant="h5" gutterBottom>
                  🎬 Gêneros Sugeridos
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  {genreSuggestion.suggestedGenres.map((genre, index) => (
                    <Card key={index} sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                          {index + 1}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="h6">{genre.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {genre.reason}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </Box>

                <Box
                  display="flex"
                  gap={2}
                  justifyContent="center"
                  sx={{ mt: 3 }}
                >
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    onClick={() =>
                      handleUseSuggestedGenres(genreSuggestion.suggestedGenres)
                    }
                    startIcon={<AutoAwesomeIcon />}
                  >
                    Usar Estes Gêneros
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={handleCloseSuggestionModal}
                  >
                    Cancelar
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Modal>
      </ThemeProvider>
    );
  }

  // View de seleção de gêneros
  return (
    <ThemeProvider theme={theme}>
      <Box minHeight="100vh" bgcolor="background.default" sx={{ p: 2 }}>
        <Container maxWidth="md">
          <AppBar position="static" sx={{ mb: 3 }}>
            <Toolbar>
              <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                <MovieIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                Which Movie?
              </Typography>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleOpenHistoryModal}
                startIcon={<HistoryIcon />}
              >
                Histórico
              </Button>
            </Toolbar>
          </AppBar>

          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Gêneros que você quer (máximo 3):
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Selecione até 3 gêneros que você gostaria de ver em um filme
              recomendado
            </Typography>

            {/* Botão de Sugestão */}
            <Box textAlign="center" mb={3}>
              <Button
                variant="contained"
                onClick={handleOpenSuggestionModal}
                startIcon={<AutoAwesomeIcon />}
                sx={{
                  px: 2.5,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                  backgroundColor: "#8b5cf6", // Violet-500
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#7c3aed", // Violet-600
                    transform: "translateY(-1px)",
                    boxShadow: 3,
                  },
                  "&:active": {
                    backgroundColor: "#6d28d9", // Violet-700
                    transform: "translateY(0)",
                  },
                }}
              >
                Sugerir Gêneros
              </Button>
            </Box>

            <Box display="flex" flexWrap="wrap" gap={1}>
              {genres.map((genre) => (
                <Chip
                  key={genre.id}
                  label={genre.name}
                  onClick={() => handleIncludeGenre(genre.id)}
                  disabled={
                    selectedGenres.length >= 3 &&
                    !selectedGenres.includes(genre.id)
                  }
                  color={
                    selectedGenres.includes(genre.id) ? "primary" : "default"
                  }
                  variant={
                    selectedGenres.includes(genre.id) ? "filled" : "outlined"
                  }
                  sx={{
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
                    "&:hover": {
                      transform: "scale(1.05)",
                    },
                  }}
                />
              ))}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {selectedGenres.length}/3 gêneros selecionados
            </Typography>
          </Card>

          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Gêneros que você NÃO quer (opcional):
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Selecione gêneros que você prefere evitar
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {genres.map((genre) => (
                <Chip
                  key={genre.id}
                  label={genre.name}
                  onClick={() => handleExcludeGenre(genre.id)}
                  disabled={isGenreDisabled(genre.id)}
                  color={
                    excludedGenres.includes(genre.id) ? "error" : "default"
                  }
                  variant={
                    excludedGenres.includes(genre.id) ? "filled" : "outlined"
                  }
                  sx={{
                    cursor: isGenreDisabled(genre.id)
                      ? "not-allowed"
                      : "pointer",
                    opacity: isGenreDisabled(genre.id) ? 0.5 : 1,
                    "&:hover": {
                      transform: "scale(1.05)",
                    },
                  }}
                />
              ))}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {excludedGenres.length} gêneros excluídos
            </Typography>
          </Card>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Erro ao buscar recomendação: {error}
            </Alert>
          )}

          <Box textAlign="center">
            <Button
              variant="contained"
              size="large"
              onClick={handleGetRecommendation}
              disabled={selectedGenres.length === 0 || loading}
              startIcon={<MovieIcon />}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "1.1rem",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 4,
                },
              }}
            >
              {loading ? "Buscando..." : "Buscar Recomendação"}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Modal de Histórico */}
      {showHistoryModal && (
        <Modal
          open={showHistoryModal}
          onClose={handleCloseHistoryModal}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          }}
        >
          <Paper
            sx={{
              width: 400,
              height: "100vh",
              overflow: "auto",
              position: "relative",
              p: 3,
              borderRadius: 0,
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
            }}
          >
            <IconButton
              onClick={handleCloseHistoryModal}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
              }}
            >
              <CloseIcon />
            </IconButton>

            <Typography variant="h4" sx={{ mb: 3 }}>
              <LibraryBooksIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Histórico de Filmes
            </Typography>

            {/* Abas de Navegação */}
            <Box sx={{ mb: 3 }}>
              <Box
                display="flex"
                gap={1}
                sx={{ borderBottom: 1, borderColor: "divider" }}
              >
                <Button
                  variant={historyView === "watched" ? "contained" : "text"}
                  onClick={() => setHistoryView("watched")}
                  startIcon={<VisibilityIcon />}
                  sx={{
                    borderRadius: 0,
                    borderBottom: historyView === "watched" ? 2 : 0,
                    borderColor: "primary.main",
                    textTransform: "none",
                    fontWeight: historyView === "watched" ? 600 : 400,
                  }}
                >
                  Assistidos ({watchedMovies.length})
                </Button>
                <Button
                  variant={historyView === "recommended" ? "contained" : "text"}
                  onClick={() => setHistoryView("recommended")}
                  startIcon={<RecommendIcon />}
                  sx={{
                    borderRadius: 0,
                    borderBottom: historyView === "recommended" ? 2 : 0,
                    borderColor: "primary.main",
                    textTransform: "none",
                    fontWeight: historyView === "recommended" ? 600 : 400,
                  }}
                >
                  Recomendados ({recommendedMovies.length})
                </Button>
              </Box>
            </Box>

            {historyLoading && (
              <Box textAlign="center" py={4}>
                <LinearProgress sx={{ width: 200, mx: "auto", mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Carregando histórico...
                </Typography>
              </Box>
            )}

            {historyError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Erro: {historyError}
              </Alert>
            )}

            {!historyLoading && !historyError && (
              <Box>
                {historyView === "watched" ? (
                  /* Filmes Assistidos */
                  <Box>
                    {watchedMovies.length === 0 ? (
                      <Box textAlign="center" py={4}>
                        <VisibilityIcon
                          sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                        />
                        <Typography
                          variant="h6"
                          color="text.secondary"
                          gutterBottom
                        >
                          Nenhum filme assistido ainda
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Os filmes que você marcar como assistidos aparecerão
                          aqui
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        {/* Botão de Análise */}
                        <Box sx={{ mb: 3, textAlign: "center" }}>
                          <Button
                            variant="outlined"
                            onClick={handleOpenAnalysisModal}
                            startIcon={<AutoAwesomeIcon />}
                            sx={{
                              px: 2.5,
                              py: 1.2,
                              fontSize: "1rem",
                              backgroundColor: "#8b5cf6",
                              borderColor: "#8b5cf6",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "#7c3aed",
                                borderColor: "#7c3aed",
                                transform: "translateY(-1px)",
                                boxShadow: 3,
                              },
                              "&:active": {
                                backgroundColor: "#6d28d9",
                                borderColor: "#6d28d9",
                                transform: "translateY(0)",
                              },
                            }}
                          >
                            Análise dos Filmes Assistidos
                          </Button>
                        </Box>
                        <List>
                          {watchedMovies.map((movie) => (
                            <ListItem
                              key={movie.id}
                              sx={{
                                bgcolor: "rgba(51, 65, 85, 0.3)",
                                mb: 1,
                                borderRadius: 1,
                                position: "relative",
                                border: "1px solid rgba(51, 65, 85, 0.5)",
                                p: 2,
                              }}
                            >
                              {/* Ícone de ação no canto superior direito */}
                              <IconButton
                                onClick={() =>
                                  handleRemoveFromWatched(movie.movieId)
                                }
                                disabled={
                                  removingFromWatchedLoading === movie.movieId
                                }
                                size="small"
                                sx={{
                                  position: "absolute",
                                  top: 8,
                                  right: 8,
                                  color: "error.main",
                                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                                  "&:hover": {
                                    backgroundColor: "rgba(239, 68, 68, 0.2)",
                                  },
                                  zIndex: 1,
                                }}
                              >
                                {removingFromWatchedLoading ===
                                movie.movieId ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <CancelIcon fontSize="small" />
                                )}
                              </IconButton>

                              {/* Conteúdo do card */}
                              <Box
                                display="flex"
                                gap={2}
                                sx={{ width: "100%" }}
                              >
                                {movie.poster && (
                                  <img
                                    src={movie.poster}
                                    alt={movie.title}
                                    style={{
                                      width: "50px",
                                      height: "75px",
                                      borderRadius: "8px",
                                      objectFit: "cover",
                                      flexShrink: 0,
                                    }}
                                  />
                                )}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography
                                    variant="subtitle1"
                                    sx={{
                                      mb: 0.5,
                                      fontWeight: 600,
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    {movie.title}
                                  </Typography>
                                  {renderGenres(movie.genres)}
                                  <Box sx={{ mt: 1 }}>
                                    <StarRating
                                      rating={movie.rating}
                                      onRatingChange={(rating) =>
                                        handleUpdateRating(
                                          movie.movieId,
                                          rating
                                        )
                                      }
                                      movieId={movie.movieId}
                                    />
                                  </Box>
                                </Box>
                              </Box>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                ) : (
                  /* Filmes Recomendados */
                  <Box>
                    {recommendedMovies.length === 0 ? (
                      <Box textAlign="center" py={4}>
                        <RecommendIcon
                          sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                        />
                        <Typography
                          variant="h6"
                          color="text.secondary"
                          gutterBottom
                        >
                          Nenhum filme recomendado ainda
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          As recomendações que você receber aparecerão aqui
                        </Typography>
                      </Box>
                    ) : (
                      <List>
                        {recommendedMovies.map((movie) => (
                          <ListItem
                            key={movie.id}
                            sx={{
                              bgcolor: "rgba(51, 65, 85, 0.3)",
                              mb: 1,
                              borderRadius: 1,
                              position: "relative",
                              border: "1px solid rgba(51, 65, 85, 0.5)",
                              p: 2,
                            }}
                          >
                            {/* Ícone de ação no canto superior direito */}
                            {isMovieWatched(movie.movieId) ? (
                              <IconButton
                                onClick={() =>
                                  handleRemoveFromWatched(movie.movieId)
                                }
                                disabled={
                                  removingFromWatchedLoading === movie.movieId
                                }
                                size="small"
                                sx={{
                                  position: "absolute",
                                  top: 8,
                                  right: 8,
                                  color: "error.main",
                                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                                  "&:hover": {
                                    backgroundColor: "rgba(239, 68, 68, 0.2)",
                                  },
                                  zIndex: 1,
                                }}
                              >
                                {removingFromWatchedLoading ===
                                movie.movieId ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <CancelIcon fontSize="small" />
                                )}
                              </IconButton>
                            ) : (
                              <IconButton
                                onClick={() => handleAddToWatched(movie)}
                                disabled={addingToWatchedLoading}
                                size="small"
                                sx={{
                                  position: "absolute",
                                  top: 8,
                                  right: 8,
                                  color: "success.main",
                                  backgroundColor: "rgba(34, 197, 94, 0.1)",
                                  "&:hover": {
                                    backgroundColor: "rgba(34, 197, 94, 0.2)",
                                  },
                                  zIndex: 1,
                                }}
                              >
                                {addingToWatchedLoading ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <CheckCircleIcon fontSize="small" />
                                )}
                              </IconButton>
                            )}

                            {/* Conteúdo do card */}
                            <Box display="flex" gap={2} sx={{ width: "100%" }}>
                              {movie.poster && (
                                <img
                                  src={movie.poster}
                                  alt={movie.title}
                                  style={{
                                    width: "50px",
                                    height: "75px",
                                    borderRadius: "8px",
                                    objectFit: "cover",
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="subtitle1"
                                  sx={{
                                    mb: 0.5,
                                    fontWeight: 600,
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {movie.title}
                                </Typography>
                                {renderGenres(movie.genres)}
                              </Box>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Modal>
      )}

      {/* Modal de Análise - Renderizado sempre */}
      {showAnalysisModal && (
        <Modal
          open={showAnalysisModal}
          onClose={handleCloseAnalysisModal}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            zIndex: 9999,
          }}
        >
          <Paper
            sx={{
              maxWidth: 800,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              position: "relative",
              p: 3,
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
            }}
          >
            <IconButton
              onClick={handleCloseAnalysisModal}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
              }}
            >
              <CloseIcon />
            </IconButton>

            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
              <AutoAwesomeIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Análise dos Seus Filmes
            </Typography>

            {analysisLoading && (
              <Box textAlign="center" py={4}>
                <LinearProgress sx={{ width: 200, mx: "auto", mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Analisando seus filmes assistidos...
                </Typography>
              </Box>
            )}

            {analysisError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Erro: {analysisError}
              </Alert>
            )}

            {analysisData && !analysisLoading && (
              <Box>
                {/* Análise Geral */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h5" gutterBottom>
                    📊 Análise Geral
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {analysisData.analysis}
                  </Typography>
                </Box>

                {/* Estatísticas de Avaliação */}
                {analysisData.ratingStats.totalMovies > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" gutterBottom>
                      ⭐ Avaliações
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={2}>
                      <Card
                        sx={{
                          p: 2,
                          textAlign: "center",
                          flex: 1,
                          minWidth: 150,
                        }}
                      >
                        <Typography variant="h4" color="primary.main">
                          {analysisData.ratingStats.averageRating}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Média Geral
                        </Typography>
                      </Card>
                      <Card
                        sx={{
                          p: 2,
                          textAlign: "center",
                          flex: 1,
                          minWidth: 150,
                        }}
                      >
                        <Typography variant="h4" color="success.main">
                          {analysisData.ratingStats.highlyRated}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Altamente Avaliados (4-5)
                        </Typography>
                      </Card>
                      <Card
                        sx={{
                          p: 2,
                          textAlign: "center",
                          flex: 1,
                          minWidth: 150,
                        }}
                      >
                        <Typography variant="h4" color="warning.main">
                          {analysisData.ratingStats.mediumRated}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Medianamente Avaliados (3)
                        </Typography>
                      </Card>
                      <Card
                        sx={{
                          p: 2,
                          textAlign: "center",
                          flex: 1,
                          minWidth: 150,
                        }}
                      >
                        <Typography variant="h4" color="error.main">
                          {analysisData.ratingStats.lowRated}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Pouco Avaliados (1-2)
                        </Typography>
                      </Card>
                    </Box>
                  </Box>
                )}

                {/* Gráfico de Gêneros */}
                {analysisData.genreStats.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" gutterBottom>
                      🎬 Gêneros Mais Assistidos
                    </Typography>
                    <Box sx={{ maxHeight: 300, overflow: "auto" }}>
                      {analysisData.genreStats.map((stat) => (
                        <Box
                          key={stat.genre}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 2,
                            p: 2,
                            bgcolor: "rgba(51, 65, 85, 0.3)",
                            borderRadius: 1,
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                              mb={1}
                            >
                              <Typography variant="subtitle1">
                                {stat.genre}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {stat.count} filmes ({stat.percentage}%)
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                position: "relative",
                                height: 8,
                                bgcolor: "rgba(51, 65, 85, 0.5)",
                                borderRadius: 4,
                              }}
                            >
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  height: "100%",
                                  width: `${stat.percentage}%`,
                                  bgcolor: "primary.main",
                                  borderRadius: 4,
                                  transition: "width 0.3s ease",
                                }}
                              />
                            </Box>
                            {stat.averageRating > 0 && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                              >
                                Avaliação média: {stat.averageRating}/5
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Recomendações */}
                {analysisData.recommendations.length > 0 && (
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      💡 Recomendações
                    </Typography>
                    <List>
                      {analysisData.recommendations.map((rec, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemText
                            primary={rec}
                            sx={{
                              "& .MuiListItemText-primary": {
                                color: "text.secondary",
                                lineHeight: 1.5,
                              },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Modal>
      )}
    </ThemeProvider>
  );
}

export default App;
