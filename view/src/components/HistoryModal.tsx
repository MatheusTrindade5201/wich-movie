import React from "react";
import {
  Modal,
  Paper,
  IconButton,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  Alert,
  LinearProgress,
  CircularProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  LibraryBooks as LibraryBooksIcon,
  Visibility as VisibilityIcon,
  Recommend as RecommendIcon,
  AutoAwesome as AutoAwesomeIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { Rating } from "@mui/material";

interface WatchedMovie {
  id: number;
  movieId: number;
  title: string;
  poster: string | null;
  genres: string | null;
  rating: number | null;
}

interface RecommendedMovie {
  id: number;
  movieId: number;
  title: string;
  poster: string | null;
  genres: string | null;
}

interface HistoryModalProps {
  open: boolean;
  onClose: () => void;
  historyView: "watched" | "recommended";
  setHistoryView: (view: "watched" | "recommended") => void;
  watchedMovies: WatchedMovie[];
  recommendedMovies: RecommendedMovie[];
  historyLoading: boolean;
  historyError: string | null;
  removingFromWatchedLoading: number | null;
  addingToWatchedLoading: boolean;
  ratingLoading: number | null;
  onRemoveFromWatched: (movieId: number) => void;
  onAddToWatched: (movie: RecommendedMovie | any) => void;
  onUpdateRating: (movieId: number, rating: number) => void;
  onOpenAnalysisModal: () => void;
  isMovieWatched: (movieId: number) => boolean;
  renderGenres: (genres: string | string[] | null) => React.ReactNode;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  open,
  onClose,
  historyView,
  setHistoryView,
  watchedMovies,
  recommendedMovies,
  historyLoading,
  historyError,
  removingFromWatchedLoading,
  addingToWatchedLoading,
  ratingLoading,
  onRemoveFromWatched,
  onAddToWatched,
  onUpdateRating,
  onOpenAnalysisModal,
  isMovieWatched,
  renderGenres,
}) => {
  // Componente StarRating local
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
                "& .MuiRating-iconEmpty": {
                  color: "rgba(251, 191, 36, 0.3)",
                },
              }}
            />
            {rating ? (
              <Typography variant="body2" color="text.secondary">
                {rating}/5
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Clique para avaliar
              </Typography>
            )}
          </>
        )}
      </Box>
    );
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      container={() => document.body}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        zIndex: 99999,
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
          onClick={onClose}
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
                      Os filmes que você marcar como assistidos aparecerão aqui
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    {/* Botão de Análise */}
                    <Box sx={{ mb: 3, textAlign: "center" }}>
                      <Button
                        variant="outlined"
                        onClick={onOpenAnalysisModal}
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
                            onClick={() => onRemoveFromWatched(movie.movieId)}
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
                            {removingFromWatchedLoading === movie.movieId ? (
                              <CircularProgress size={16} />
                            ) : (
                              <CancelIcon fontSize="small" />
                            )}
                          </IconButton>

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
                              <Box sx={{ mt: 1 }}>
                                <StarRating
                                  rating={movie.rating}
                                  onRatingChange={(rating) =>
                                    onUpdateRating(movie.movieId, rating)
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
                            onClick={() => onRemoveFromWatched(movie.movieId)}
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
                            {removingFromWatchedLoading === movie.movieId ? (
                              <CircularProgress size={16} />
                            ) : (
                              <CancelIcon fontSize="small" />
                            )}
                          </IconButton>
                        ) : (
                          <IconButton
                            onClick={() => onAddToWatched(movie)}
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
  );
};

export default HistoryModal;
