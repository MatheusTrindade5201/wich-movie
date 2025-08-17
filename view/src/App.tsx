import React, { useState } from "react";
import {
  useMovieGenres,
  useMovieRecommendation,
  type MovieGenre,
} from "./lib/hooks";

function App() {
  const { genres, loading, error } = useMovieGenres();
  const {
    recommendation,
    loading: recommendationLoading,
    error: recommendationError,
    getRecommendation,
    resetRecommendation,
  } = useMovieRecommendation();
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [excludedGenres, setExcludedGenres] = useState<number[]>([]);
  const [showGenres, setShowGenres] = useState(true);

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

    await getRecommendation(selectedGenres, excludedGenres);
    setShowGenres(false);
  };

  const handleNewRecommendation = () => {
    resetRecommendation();
    setShowGenres(true);
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
        <div>Carregando gêneros...</div>
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
          <h2>Erro ao carregar gêneros</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // View de recomendação de filme
  if (!showGenres && recommendation) {
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
        <div
          style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}
        >
          <h1 style={{ marginBottom: "30px" }}>Filme Recomendado</h1>

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

          {/* Seção de Vídeos */}
          {recommendation.videos && recommendation.videos.length > 0 && (
            <div style={{ marginBottom: "30px", textAlign: "left" }}>
              <h3 style={{ marginBottom: "15px", color: "#e2e8f0" }}>
                🎬 Trailer
              </h3>
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
                      style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
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
                      style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
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
                      style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
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
        <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
          Which Movie?
        </h1>

        <div style={{ marginBottom: "30px" }}>
          <h2>Gêneros que você quer (máximo 3):</h2>
          <p style={{ color: "#94a3b8", marginBottom: "15px" }}>
            Selecione até 3 gêneros que você gostaria de ver em um filme
            recomendado
          </p>
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

        {recommendationError && (
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
            Erro ao buscar recomendação: {recommendationError}
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          <button
            onClick={handleGetRecommendation}
            disabled={selectedGenres.length === 0 || recommendationLoading}
            style={{
              padding: "12px 24px",
              backgroundColor:
                selectedGenres.length > 0 && !recommendationLoading
                  ? "#3b82f6"
                  : "#475569",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor:
                selectedGenres.length > 0 && !recommendationLoading
                  ? "pointer"
                  : "not-allowed",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            {recommendationLoading ? "Buscando..." : "Buscar Recomendação"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
