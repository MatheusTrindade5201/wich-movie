// Interfaces para as tools
export interface MovieGenre {
  id: number;
  name: string;
}

export interface MovieVideo {
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface WatchProvider {
  provider_name: string;
  logo_path?: string;
}

export interface WatchProviders {
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

export interface MovieRecommendation {
  movieId: number;
  title: string;
  overview: string;
  posterUrl: string;
  genres?: string[];
  videos?: MovieVideo[];
  watchProviders?: WatchProviders;
}

export interface MovieReviews {
  summary: string;
  sentiment: string;
  keyPoints: string[];
}

export interface RecommendedMovie {
  id: number;
  movieId: number;
  title: string;
  poster: string | null;
  genres: string | null;
  createdAt: string;
}

export interface WatchedMovie {
  id: number;
  movieId: number;
  title: string;
  poster: string | null;
  genres: string | null;
  rating: number | null;
  createdAt: string;
}

export interface SuggestedGenre {
  id: number;
  name: string;
  reason: string;
}

export interface GenreSuggestion {
  suggestedGenres: SuggestedGenre[];
  analysis: string;
}

interface CustomTools {
  LIST_MOVIE_GENRES: () => Promise<{ genres: MovieGenre[] }>;
  RECOMMEND_MOVIE: (input: {
    includeGenreIds: number[];
    excludeGenreIds?: number[];
  }) => Promise<MovieRecommendation>;
  GET_MOVIE_REVIEWS: (input: { movieId: number }) => Promise<MovieReviews>;
  GET_RECOMMENDED_MOVIES: () => Promise<{ movies: RecommendedMovie[] }>;
  GET_WATCHED_MOVIES: () => Promise<{ movies: WatchedMovie[] }>;
  ADD_WATCHED_MOVIE: (input: {
    movieId: number;
    title: string;
    poster?: string;
    genres?: string[];
  }) => Promise<{ success: boolean; id: number }>;
  REMOVE_WATCHED_MOVIE: (input: {
    movieId: number;
  }) => Promise<{ success: boolean }>;
  UPDATE_MOVIE_RATING: (input: {
    movieId: number;
    rating: number;
  }) => Promise<{ success: boolean; message: string }>;
  SUGGEST_GENRES: (input: {
    preference: "comfort" | "new";
  }) => Promise<GenreSuggestion>;
}

// Cliente RPC simples para comunicação com o servidor MCP
class RPCClient {
  private baseUrl = "/mcp";

  async callTool<T>(toolName: string, args: any = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Verificar se a resposta é um stream de eventos
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/event-stream")) {
      const text = await response.text();
      const lines = text.split("\n");

      // Procurar pela linha que contém o resultado JSON
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const jsonData = JSON.parse(line.slice(6)); // Remove 'data: '

            // Verificar se há erro
            if (jsonData.error) {
              throw new Error(`RPC error: ${jsonData.error.message}`);
            }

            // Verificar se há erro no resultado
            if (jsonData.result && jsonData.result.isError) {
              throw new Error(
                `Tool error: ${jsonData.result.content?.[0]?.text || "Unknown error"}`
              );
            }

            // Extrair dados do formato do Deco
            if (jsonData.result && jsonData.result.structuredContent) {
              return jsonData.result.structuredContent;
            }

            // Fallback para formato direto
            if (jsonData.result) {
              return jsonData.result;
            }
          } catch (parseError) {
            // Ignorar linhas que não são JSON válido
            continue;
          }
        }
      }
      throw new Error("No valid response found in event stream");
    } else {
      // Resposta JSON normal
      const data = await response.json();

      if (data.error) {
        throw new Error(`RPC error: ${data.error.message}`);
      }

      return data.result;
    }
  }

  async LIST_MOVIE_GENRES(): Promise<{ genres: MovieGenre[] }> {
    return this.callTool<{ genres: MovieGenre[] }>("LIST_MOVIE_GENRES");
  }

  async RECOMMEND_MOVIE(input: {
    includeGenreIds: number[];
    excludeGenreIds: number[];
  }): Promise<MovieRecommendation> {
    return this.callTool("RECOMMEND_MOVIE", input);
  }

  async GET_MOVIE_REVIEWS(input: { movieId: number }): Promise<MovieReviews> {
    return this.callTool("GET_MOVIE_REVIEWS", input);
  }

  async GET_RECOMMENDED_MOVIES(): Promise<{ movies: RecommendedMovie[] }> {
    return this.callTool("GET_RECOMMENDED_MOVIES");
  }

  async GET_WATCHED_MOVIES(): Promise<{ movies: WatchedMovie[] }> {
    return this.callTool("GET_WATCHED_MOVIES");
  }

  async ADD_WATCHED_MOVIE(input: {
    movieId: number;
    title: string;
    poster?: string;
    genres?: string[];
  }): Promise<{ success: boolean; id: number }> {
    return this.callTool("ADD_WATCHED_MOVIE", input);
  }

  async REMOVE_WATCHED_MOVIE(input: {
    movieId: number;
  }): Promise<{ success: boolean }> {
    return this.callTool("REMOVE_WATCHED_MOVIE", input);
  }

  async UPDATE_MOVIE_RATING(input: {
    movieId: number;
    rating: number;
  }): Promise<{ success: boolean; message: string }> {
    return this.callTool("UPDATE_MOVIE_RATING", input);
  }

  async SUGGEST_GENRES(input: {
    preference: "comfort" | "new";
  }): Promise<GenreSuggestion> {
    return this.callTool("SUGGEST_GENRES", input);
  }
}

export const client = new RPCClient() as unknown as CustomTools;
