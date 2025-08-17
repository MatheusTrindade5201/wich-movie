/**
 * This is where you define your tools.
 *
 * Tools are the functions that will be available on your
 * MCP server. They can be called from any other Deco app
 * or from your front-end code via typed RPC. This is the
 * recommended way to build your Web App.
 *
 * @see https://docs.deco.page/en/guides/creating-tools/
 */
import { createTool } from "@deco/workers-runtime/mastra";
import { z } from "zod";
import type { Env } from "./main.ts";
import { getDb } from "./db.ts";
import { eq, desc } from "drizzle-orm";
import {
  tmdbApiKeyTable,
  recommendedMoviesTable,
  watchedMoviesTable,
  todosTable,
} from "./schema.ts";

// Helper functions para API key
async function getTmdbApiKey(env: Env): Promise<string> {
  const db = await getDb(env);
  const apiKeyRow = await db
    .select()
    .from(tmdbApiKeyTable)
    .where(eq(tmdbApiKeyTable.id, 1));

  const apiKey = apiKeyRow[0]?.apiKey;
  if (!apiKey) {
    throw new Error(
      "TMDB API key not configured. Use SET_TMDB_API_KEY para configurar."
    );
  }

  return apiKey;
}

function isTmdbV4Token(apiKey: string): boolean {
  return apiKey.startsWith("eyJ");
}

function createTmdbFetchOptions(
  apiKey: string,
  baseUrl: string
): {
  url: string;
  fetchOptions: RequestInit;
} {
  if (isTmdbV4Token(apiKey)) {
    // Token v4
    return {
      url: baseUrl,
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    };
  } else {
    // API Key v3
    const separator = baseUrl.includes("?") ? "&" : "?";
    return {
      url: `${baseUrl}${separator}api_key=${apiKey}`,
      fetchOptions: {},
    };
  }
}

// Helper para tratamento de erros HTTP
async function fetchTmdbApi(url: string, fetchOptions: RequestInit) {
  const res = await fetch(url, fetchOptions);
  if (!res.ok) {
    let errorBody = "";
    try {
      errorBody = await res.text();
    } catch {}
    throw new Error(
      `TMDB API error: ${res.status} ${res.statusText} - ${errorBody}`
    );
  }
  return res;
}

// Helper para parsing de gêneros
function parseGenres(genresString: string | null): string[] {
  if (!genresString) return [];
  try {
    const parsed = JSON.parse(genresString);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Helper para mapeamento de provedores
function mapProviders(providers: any, type: "flatrate" | "rent" | "buy") {
  return (
    providers?.[type]?.map((p: any) => ({
      provider_name: p.provider_name,
      logo_path: p.logo_path
        ? `https://image.tmdb.org/t/p/original${p.logo_path}`
        : undefined,
    })) || []
  );
}

// Helper para operações de banco seguras
async function safeDbOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(errorMessage, error);
    throw new Error(errorMessage);
  }
}

export const createRecommendMovieTool = (env: Env) =>
  createTool({
    id: "RECOMMEND_MOVIE",
    description:
      "Recomenda um filme aleatório usando a API do TMDB, com filtros de gêneros.",
    inputSchema: z.object({
      includeGenreIds: z.array(z.number()).min(1).max(3),
      excludeGenreIds: z.array(z.number()).optional(),
    }),
    outputSchema: z.object({
      movieId: z.number(),
      title: z.string(),
      overview: z.string(),
      posterUrl: z.string(),
      genres: z.array(z.string()).optional(),
      videos: z
        .array(
          z.object({
            key: z.string(),
            name: z.string(),
            site: z.string(),
            type: z.string(),
          })
        )
        .optional(),
      watchProviders: z
        .object({
          flatrate: z
            .array(
              z.object({
                provider_name: z.string(),
                logo_path: z.string().optional(),
              })
            )
            .optional(),
          rent: z
            .array(
              z.object({
                provider_name: z.string(),
                logo_path: z.string().optional(),
              })
            )
            .optional(),
          buy: z
            .array(
              z.object({
                provider_name: z.string(),
                logo_path: z.string().optional(),
              })
            )
            .optional(),
        })
        .optional(),
    }),
    execute: async ({ context }) => {
      const apiKey = await getTmdbApiKey(env);

      let baseUrl =
        "https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&language=pt-BR&include_video=true&with_watch_providers=8|119|9|220|350|2|3|15|192|531|7|97|384|8|119|9|220|350|2|3|15|192|531|7|97|384";

      // Adiciona gêneros incluídos
      if (context.includeGenreIds && context.includeGenreIds.length > 0) {
        baseUrl += `&with_genres=${context.includeGenreIds.join(",")}`;
      }
      // Adiciona gêneros excluídos
      if (context.excludeGenreIds && context.excludeGenreIds.length > 0) {
        baseUrl += `&without_genres=${context.excludeGenreIds.join(",")}`;
      }

      const { url, fetchOptions } = createTmdbFetchOptions(apiKey, baseUrl);
      const res = await fetchTmdbApi(url, fetchOptions);
      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        throw new Error("Nenhum filme encontrado na resposta do TMDB");
      }
      // Seleciona um filme aleatório da lista
      const movie =
        data.results[Math.floor(Math.random() * data.results.length)];

      // Buscar gêneros do filme
      let genres: string[] = [];
      try {
        const genresBaseUrl = `https://api.themoviedb.org/3/movie/${movie.id}?language=pt-BR`;
        const { url: genresUrl, fetchOptions: genresFetchOptions } =
          createTmdbFetchOptions(apiKey, genresBaseUrl);

        const genresRes = await fetchTmdbApi(genresUrl, genresFetchOptions);
        const movieData = await genresRes.json();
        genres = movieData.genres?.map((g: any) => g.name) || [];
      } catch (error) {
        console.error("Erro ao buscar gêneros do filme:", error);
      }

      const movieResult = {
        movieId: movie.id,
        title: movie.title,
        overview: movie.overview,
        posterUrl: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : "",
      };

      // Buscar vídeos do filme
      let videos: any[] = [];
      try {
        const videosBaseUrl = `https://api.themoviedb.org/3/movie/${movie.id}/videos?language=pt-BR`;
        const { url: videosUrl, fetchOptions: videosFetchOptions } =
          createTmdbFetchOptions(apiKey, videosBaseUrl);

        const videosRes = await fetchTmdbApi(videosUrl, videosFetchOptions);
        const videosData = await videosRes.json();
        videos =
          videosData.results?.filter(
            (v: any) => v.site === "YouTube" && v.type === "Trailer"
          ) || [];
      } catch (error) {
        console.error("Erro ao buscar vídeos do filme:", error);
      }

      // Buscar provedores de streaming do filme
      let watchProviders: any = {};
      try {
        const providersBaseUrl = `https://api.themoviedb.org/3/movie/${movie.id}/watch/providers`;
        const { url: providersUrl, fetchOptions: providersFetchOptions } =
          createTmdbFetchOptions(apiKey, providersBaseUrl);

        const providersRes = await fetchTmdbApi(
          providersUrl,
          providersFetchOptions
        );
        const providersData = await providersRes.json();
        // Buscar provedores do Brasil (BR)
        const brProviders = providersData.results?.BR;
        if (brProviders) {
          watchProviders = {
            flatrate: mapProviders(brProviders, "flatrate"),
            rent: mapProviders(brProviders, "rent"),
            buy: mapProviders(brProviders, "buy"),
          };
        }
      } catch (error) {
        console.error("Erro ao buscar provedores de streaming:", error);
      }

      // Salvar filme recomendado no banco
      const db = await getDb(env);
      await safeDbOperation(
        () =>
          db.insert(recommendedMoviesTable).values({
            movieId: movieResult.movieId,
            title: movieResult.title,
            poster: movieResult.posterUrl || null,
            genres: genres.length > 0 ? JSON.stringify(genres) : null,
            createdAt: new Date(),
          }),
        "Erro ao salvar filme recomendado"
      ).catch(() => {
        // Não falhar se não conseguir salvar
      });

      return {
        ...movieResult,
        genres: genres.length > 0 ? genres : undefined,
        videos: videos.length > 0 ? videos : undefined,
        watchProviders:
          Object.keys(watchProviders).length > 0 ? watchProviders : undefined,
      };
    },
  });

export const createSetTmdbApiKeyTool = (env: Env) =>
  createTool({
    id: "SET_TMDB_API_KEY",
    description: "Configura a chave de API do TMDB no banco de dados.",
    inputSchema: z.object({
      apiKey: z.string(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
    }),
    execute: async ({ context }) => {
      const db = await getDb(env);
      // Verifica se já existe uma chave
      const existing = await db
        .select()
        .from(tmdbApiKeyTable)
        .where(eq(tmdbApiKeyTable.id, 1));
      if (existing.length > 0) {
        // Atualiza
        await db
          .update(tmdbApiKeyTable)
          .set({ apiKey: context.apiKey })
          .where(eq(tmdbApiKeyTable.id, 1));
      } else {
        // Insere
        await db
          .insert(tmdbApiKeyTable)
          .values({ id: 1, apiKey: context.apiKey });
      }
      return { success: true };
    },
  });

export const createListMovieGenresTool = (env: Env) =>
  createTool({
    id: "LIST_MOVIE_GENRES",
    description: "Lista os gêneros oficiais de filmes do TMDB.",
    inputSchema: z.object({}),
    outputSchema: z.object({
      genres: z.array(
        z.object({
          id: z.number(),
          name: z.string(),
        })
      ),
    }),
    execute: async ({ context }) => {
      const apiKey = await getTmdbApiKey(env);
      const baseUrl =
        "https://api.themoviedb.org/3/genre/movie/list?language=pt-BR";
      const { url, fetchOptions } = createTmdbFetchOptions(apiKey, baseUrl);
      const res = await fetchTmdbApi(url, fetchOptions);
      const data = await res.json();
      if (!data.genres || !Array.isArray(data.genres)) {
        throw new Error("Resposta inesperada do TMDB ao buscar gêneros");
      }
      return { genres: data.genres };
    },
  });

export const createGetMovieReviewsTool = (env: Env) =>
  createTool({
    id: "GET_MOVIE_REVIEWS",
    description:
      "Obtém e analisa as reviews de um filme pelo ID do TMDB, gerando um resumo com IA.",
    inputSchema: z.object({
      movieId: z.number(),
    }),
    outputSchema: z.object({
      summary: z.string(),
      sentiment: z.string(),
      keyPoints: z.array(z.string()),
    }),
    execute: async ({ context }) => {
      const apiKey = await getTmdbApiKey(env);

      // Buscar reviews do filme
      const baseUrl = `https://api.themoviedb.org/3/movie/${context.movieId}/reviews?language=pt-BR&page=1`;
      const { url, fetchOptions } = createTmdbFetchOptions(apiKey, baseUrl);

      const res = await fetchTmdbApi(url, fetchOptions);

      const data = await res.json();
      const reviews = data.results || [];

      if (reviews.length === 0) {
        return {
          summary: "Nenhuma review disponível para este filme.",
          sentiment: "neutro",
          keyPoints: ["Sem reviews suficientes para análise"],
        };
      }

      // Pegar as primeiras 10 reviews para análise
      const reviewsToAnalyze = reviews.slice(0, 10);
      const reviewsText = reviewsToAnalyze
        .map((r: any) => `${r.author}: ${r.content}`)
        .join("\n\n");

      // Usar IA para analisar as reviews
      const aiAnalysis = await env.DECO_CHAT_WORKSPACE_API.AI_GENERATE_OBJECT({
        messages: [
          {
            role: "system",
            content:
              "Você é um especialista em análise de reviews de filmes. Analise as reviews fornecidas e crie um resumo conciso e informativo.",
          },
          {
            role: "user",
            content: `Analise as seguintes reviews do filme e forneça:\n\n${reviewsText}`,
          },
        ],
        schema: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description: "Resumo geral das reviews em 2-3 frases",
            },
            sentiment: {
              type: "string",
              enum: ["positivo", "negativo", "misto", "neutro"],
              description: "Sentimento geral das reviews",
            },
            keyPoints: {
              type: "array",
              items: { type: "string" },
              description: "3-5 pontos principais mencionados nas reviews",
            },
          },
          required: ["summary", "sentiment", "keyPoints"],
        },
      });

      if (!aiAnalysis.object) {
        throw new Error("Falha ao gerar análise das reviews com IA");
      }

      return {
        summary: String(aiAnalysis.object.summary || "Análise não disponível"),
        sentiment: String(aiAnalysis.object.sentiment || "neutro"),
        keyPoints: Array.isArray(aiAnalysis.object.keyPoints)
          ? aiAnalysis.object.keyPoints.map((point: any) => String(point))
          : ["Análise não disponível"],
      };
    },
  });

export const createSaveRecommendedMovieTool = (env: Env) =>
  createTool({
    id: "SAVE_RECOMMENDED_MOVIE",
    description: "Salva um filme recomendado no banco de dados",
    inputSchema: z.object({
      movieId: z.number(),
      title: z.string(),
      poster: z.string().optional(),
      genres: z.array(z.string()).optional(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      id: z.number(),
    }),
    execute: async ({ context }) => {
      const db = await getDb(env);

      try {
        const result = await db
          .insert(recommendedMoviesTable)
          .values({
            movieId: context.movieId,
            title: context.title,
            poster: context.poster || null,
            genres: context.genres ? JSON.stringify(context.genres) : null,
            createdAt: new Date(),
          })
          .returning({ id: recommendedMoviesTable.id });

        return {
          success: true,
          id: result[0].id,
        };
      } catch (error) {
        console.error("Erro ao salvar filme recomendado:", error);
        throw new Error("Falha ao salvar filme recomendado");
      }
    },
  });

export const createGetRecommendedMoviesTool = (env: Env) =>
  createTool({
    id: "GET_RECOMMENDED_MOVIES",
    description: "Lista todos os filmes recomendados salvos",
    inputSchema: z.object({}),
    outputSchema: z.object({
      movies: z.array(
        z.object({
          id: z.number(),
          movieId: z.number(),
          title: z.string(),
          poster: z.string().nullable(),
          genres: z.array(z.string()),
          createdAt: z.string(),
        })
      ),
    }),
    execute: async ({ context }) => {
      const db = await getDb(env);

      try {
        const movies = await db
          .select()
          .from(recommendedMoviesTable)
          .orderBy(recommendedMoviesTable.createdAt);

        return {
          movies: movies.map((movie) => ({
            id: movie.id,
            movieId: movie.movieId,
            title: movie.title,
            poster: movie.poster,
            genres: parseGenres(movie.genres),
            createdAt: movie.createdAt
              ? new Date(movie.createdAt).toISOString()
              : new Date().toISOString(),
          })),
        };
      } catch (error) {
        console.error("Erro ao buscar filmes recomendados:", error);
        throw new Error("Falha ao buscar filmes recomendados");
      }
    },
  });

export const createAddWatchedMovieTool = (env: Env) =>
  createTool({
    id: "ADD_WATCHED_MOVIE",
    description: "Adiciona um filme à lista de filmes assistidos",
    inputSchema: z.object({
      movieId: z.number(),
      title: z.string(),
      poster: z.string().optional(),
      genres: z.array(z.string()).optional(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      id: z.number(),
    }),
    execute: async ({ context }) => {
      const db = await getDb(env);

      // Verificar se já existe
      const existing = await safeDbOperation(
        () =>
          db
            .select()
            .from(watchedMoviesTable)
            .where(eq(watchedMoviesTable.movieId, context.movieId))
            .limit(1),
        "Erro ao verificar filme existente"
      );

      if (existing.length > 0) {
        throw new Error("Filme já está na lista de assistidos");
      }

      const result = await safeDbOperation(
        () =>
          db
            .insert(watchedMoviesTable)
            .values({
              movieId: context.movieId,
              title: context.title,
              poster: context.poster || null,
              genres: context.genres ? JSON.stringify(context.genres) : null,
              createdAt: new Date(),
            })
            .returning({ id: watchedMoviesTable.id }),
        "Erro ao adicionar filme assistido"
      );

      return {
        success: true,
        id: result[0].id,
      };
    },
  });

export const createRemoveWatchedMovieTool = (env: Env) =>
  createTool({
    id: "REMOVE_WATCHED_MOVIE",
    description: "Remove um filme da lista de filmes assistidos",
    inputSchema: z.object({
      movieId: z.number(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
    }),
    execute: async ({ context }) => {
      const db = await getDb(env);

      await safeDbOperation(
        () =>
          db
            .delete(watchedMoviesTable)
            .where(eq(watchedMoviesTable.movieId, context.movieId)),
        "Erro ao remover filme assistido"
      );

      return {
        success: true,
      };
    },
  });

export const createGetWatchedMoviesTool = (env: Env) =>
  createTool({
    id: "GET_WATCHED_MOVIES",
    description: "Lista todos os filmes assistidos",
    inputSchema: z.object({}),
    outputSchema: z.object({
      movies: z.array(
        z.object({
          id: z.number(),
          movieId: z.number(),
          title: z.string(),
          poster: z.string().nullable(),
          genres: z.array(z.string()),
          rating: z.number().nullable(),
          createdAt: z.string(),
        })
      ),
    }),
    execute: async ({ context }) => {
      const db = await getDb(env);

      const movies = await safeDbOperation(
        () =>
          db
            .select()
            .from(watchedMoviesTable)
            .orderBy(watchedMoviesTable.createdAt),
        "Erro ao buscar filmes assistidos"
      );

      return {
        movies: movies.map((movie) => ({
          id: movie.id,
          movieId: movie.movieId,
          title: movie.title,
          poster: movie.poster,
          genres: parseGenres(movie.genres),
          rating: movie.rating,
          createdAt: movie.createdAt
            ? new Date(movie.createdAt).toISOString()
            : new Date().toISOString(),
        })),
      };
    },
  });

export const createUpdateMovieRatingTool = (env: Env) =>
  createTool({
    id: "UPDATE_MOVIE_RATING",
    description: "Atualiza a avaliação de um filme assistido (1-5 estrelas)",
    inputSchema: z.object({
      movieId: z.number(),
      rating: z.number().min(1).max(5),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
    execute: async ({ context }) => {
      const db = await getDb(env);

      // Verificar se o filme existe na lista de assistidos
      const existingMovie = await safeDbOperation(
        () =>
          db
            .select()
            .from(watchedMoviesTable)
            .where(eq(watchedMoviesTable.movieId, context.movieId))
            .limit(1),
        "Erro ao verificar filme existente"
      );

      if (existingMovie.length === 0) {
        throw new Error("Filme não encontrado na lista de assistidos");
      }

      // Atualizar a avaliação
      await safeDbOperation(
        () =>
          db
            .update(watchedMoviesTable)
            .set({ rating: context.rating })
            .where(eq(watchedMoviesTable.movieId, context.movieId)),
        "Erro ao atualizar avaliação"
      );

      return {
        success: true,
        message: `Avaliação atualizada para ${context.rating} estrelas`,
      };
    },
  });

export const createSuggestGenresTool = (env: Env) =>
  createTool({
    id: "SUGGEST_GENRES",
    description:
      "Analisa filmes assistidos e sugere gêneros baseado na preferência do usuário (zona de conforto ou experiência nova).",
    inputSchema: z.object({
      preference: z.enum(["comfort", "new"]),
    }),
    outputSchema: z.object({
      suggestedGenres: z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          reason: z.string(),
        })
      ),
      analysis: z.string(),
    }),
    execute: async ({ context }) => {
      const db = await getDb(env);

      // Buscar filmes assistidos
      const watchedMovies = await safeDbOperation(
        () =>
          db
            .select()
            .from(watchedMoviesTable)
            .orderBy(desc(watchedMoviesTable.createdAt)),
        "Erro ao buscar filmes assistidos"
      );

      if (watchedMovies.length === 0) {
        // Se não há filmes assistidos, sugerir gêneros populares
        const popularGenres = [
          { id: 28, name: "Ação", reason: "Gênero popular para iniciantes" },
          { id: 12, name: "Aventura", reason: "Gênero envolvente e acessível" },
          { id: 35, name: "Comédia", reason: "Gênero leve e divertido" },
        ];

        return {
          suggestedGenres: popularGenres,
          analysis:
            "Como você ainda não tem filmes assistidos, sugerimos gêneros populares e acessíveis para começar sua jornada cinematográfica.",
        };
      }

      // Analisar gêneros dos filmes assistidos
      const genreFrequency: {
        [key: string]: {
          count: number;
          name: string;
          id: number;
          totalRating: number;
          avgRating: number;
        };
      } = {};

      watchedMovies.forEach((movie) => {
        if (movie.genres) {
          try {
            const genres = parseGenres(movie.genres);
            if (Array.isArray(genres)) {
              genres.forEach((genre) => {
                if (genreFrequency[genre]) {
                  genreFrequency[genre].count++;
                  if (movie.rating) {
                    genreFrequency[genre].totalRating += movie.rating;
                  }
                } else {
                  // Buscar ID do gênero pelo nome
                  const genreId = getGenreIdByName(genre);
                  genreFrequency[genre] = {
                    count: 1,
                    name: genre,
                    id: genreId,
                    totalRating: movie.rating || 0,
                    avgRating: movie.rating || 0,
                  };
                }
              });
            }
          } catch (error) {
            console.error("Erro ao processar gêneros do filme:", error);
          }
        }
      });

      // Calcular média de avaliação para cada gênero
      Object.values(genreFrequency).forEach((genre) => {
        genre.avgRating = genre.count > 0 ? genre.totalRating / genre.count : 0;
      });

      // Ordenar gêneros por frequência e avaliação
      const sortedGenres = Object.values(genreFrequency).sort((a, b) => {
        // Para zona de conforto: priorizar gêneros com alta avaliação
        if (context.preference === "comfort") {
          // Ordenar por avaliação média (decrescente), depois por frequência
          if (Math.abs(a.avgRating - b.avgRating) > 0.5) {
            return b.avgRating - a.avgRating;
          }
          return b.count - a.count;
        } else {
          // Para experiência nova: priorizar gêneros com baixa avaliação ou não avaliados
          if (Math.abs(a.avgRating - b.avgRating) > 0.5) {
            return a.avgRating - b.avgRating;
          }
          return a.count - b.count;
        }
      });

      // Buscar todos os gêneros disponíveis
      const allGenres = await getAllGenres(env);

      if (context.preference === "comfort") {
        // Zona de conforto: sugerir gêneros similares aos mais assistidos
        const topGenres = sortedGenres.slice(0, 3);
        const suggestedGenres = topGenres.map((genre) => ({
          id: genre.id,
          name: genre.name,
          reason:
            genre.avgRating > 0
              ? `Você assistiu ${genre.count} filmes deste gênero com avaliação média de ${genre.avgRating.toFixed(1)}/5`
              : `Você assistiu ${genre.count} filmes deste gênero`,
        }));

        return {
          suggestedGenres,
          analysis: `Baseado nos seus filmes assistidos, você parece gostar de ${topGenres.map((g) => g.name).join(", ")}. Sugerimos continuar explorando esses gêneros que você já aprecia.`,
        };
      } else {
        // Experiência nova: sugerir gêneros diferentes
        const watchedGenreNames = sortedGenres.map((g: any) =>
          g.name.toLowerCase()
        );
        const newGenres = allGenres.filter(
          (genre: any) => !watchedGenreNames.includes(genre.name.toLowerCase())
        );

        // Selecionar 3 gêneros diferentes aleatoriamente
        const shuffled = newGenres.sort(() => 0.5 - Math.random());
        const suggestedGenres = shuffled.slice(0, 3).map((genre: any) => ({
          id: genre.id,
          name: genre.name,
          reason: "Gênero diferente dos seus filmes assistidos",
        }));

        return {
          suggestedGenres,
          analysis: `Para uma experiência nova, sugerimos explorar gêneros que você ainda não assistiu muito: ${suggestedGenres.map((g: any) => g.name).join(", ")}.`,
        };
      }
    },
  });

// Função auxiliar para buscar ID do gênero pelo nome
function getGenreIdByName(genreName: string): number {
  const genreMap: { [key: string]: number } = {
    Ação: 28,
    Aventura: 12,
    Animação: 16,
    Comédia: 35,
    Crime: 80,
    Documentário: 99,
    Drama: 18,
    Família: 10751,
    Fantasia: 14,
    História: 36,
    Terror: 27,
    Música: 10402,
    Mistério: 9648,
    Romance: 10749,
    "Ficção científica": 878,
    "Cinema TV": 10770,
    Thriller: 53,
    Guerra: 10752,
    Faroeste: 37,
  };

  return genreMap[genreName] || 28; // Fallback para Ação
}

// Função auxiliar para buscar todos os gêneros
async function getAllGenres(env: Env) {
  const apiKey = await getTmdbApiKey(env);
  const baseUrl =
    "https://api.themoviedb.org/3/genre/movie/list?language=pt-BR";
  const { url, fetchOptions } = createTmdbFetchOptions(apiKey, baseUrl);

  const res = await fetchTmdbApi(url, fetchOptions);

  const data = await res.json();
  return data.genres || [];
}

export const createAnalyzeWatchedMoviesTool = (env: Env) =>
  createTool({
    id: "ANALYZE_WATCHED_MOVIES",
    description:
      "Analisa os filmes assistidos e gera insights sobre preferências do usuário",
    inputSchema: z.object({}),
    outputSchema: z.object({
      analysis: z.string(),
      genreStats: z.array(
        z.object({
          genre: z.string(),
          count: z.number(),
          averageRating: z.number(),
          percentage: z.number(),
        })
      ),
      ratingStats: z.object({
        averageRating: z.number(),
        totalMovies: z.number(),
        highlyRated: z.number(),
        mediumRated: z.number(),
        lowRated: z.number(),
      }),
      recommendations: z.array(z.string()),
    }),
    execute: async ({ context }) => {
      const db = await getDb(env);

      try {
        // Buscar filmes assistidos
        const watchedMovies = await safeDbOperation(
          () =>
            db
              .select()
              .from(watchedMoviesTable)
              .orderBy(desc(watchedMoviesTable.createdAt)),
          "Erro ao buscar filmes assistidos"
        );

        if (watchedMovies.length === 0) {
          return {
            analysis:
              "Você ainda não assistiu nenhum filme. Comece assistindo alguns filmes para receber análises personalizadas!",
            genreStats: [],
            ratingStats: {
              averageRating: 0,
              totalMovies: 0,
              highlyRated: 0,
              mediumRated: 0,
              lowRated: 0,
            },
            recommendations: [
              "Assista alguns filmes para começar a receber análises personalizadas",
              "Experimente diferentes gêneros para descobrir suas preferências",
            ],
          };
        }

        // Analisar gêneros
        const genreCount: {
          [key: string]: {
            count: number;
            totalRating: number;
            ratings: number[];
          };
        } = {};
        let totalRating = 0;
        let ratedMovies = 0;
        let highlyRated = 0;
        let mediumRated = 0;
        let lowRated = 0;

        watchedMovies.forEach((movie) => {
          const genres = parseGenres(movie.genres);
          const rating = movie.rating || 0;

          if (rating > 0) {
            totalRating += rating;
            ratedMovies++;

            if (rating >= 4) highlyRated++;
            else if (rating === 3) mediumRated++;
            else lowRated++;
          }

          genres.forEach((genre: string) => {
            if (!genreCount[genre]) {
              genreCount[genre] = { count: 0, totalRating: 0, ratings: [] };
            }
            genreCount[genre].count++;
            if (rating > 0) {
              genreCount[genre].totalRating += rating;
              genreCount[genre].ratings.push(rating);
            }
          });
        });

        // Calcular estatísticas de gêneros
        const genreStats = Object.entries(genreCount)
          .map(([genre, stats]) => ({
            genre,
            count: stats.count,
            averageRating:
              stats.ratings.length > 0
                ? Math.round((stats.totalRating / stats.ratings.length) * 10) /
                  10
                : 0,
            percentage: Math.round((stats.count / watchedMovies.length) * 100),
          }))
          .sort((a, b) => b.count - a.count);

        // Calcular estatísticas gerais
        const averageRating =
          ratedMovies > 0
            ? Math.round((totalRating / ratedMovies) * 10) / 10
            : 0;

        // Gerar análise usando AI
        const analysisPrompt = `
Analise os filmes assistidos pelo usuário e forneça insights sobre suas preferências cinematográficas.

Filmes assistidos (${watchedMovies.length} total):
${watchedMovies.map((movie) => `- ${movie.title} (${movie.rating ? movie.rating + "/5" : "sem avaliação"})`).join("\n")}

Gêneros mais assistidos:
${genreStats
  .slice(0, 5)
  .map(
    (stat) => `- ${stat.genre}: ${stat.count} filmes (${stat.averageRating}/5)`
  )
  .join("\n")}

Estatísticas gerais:
- Avaliação média: ${averageRating}/5
- Filmes altamente avaliados (4-5): ${highlyRated}
- Filmes medianamente avaliados (3): ${mediumRated}
- Filmes pouco avaliados (1-2): ${lowRated}

Forneça uma análise em português brasileiro que inclua:
1. Resumo das preferências do usuário
2. Padrões identificados nos gêneros e avaliações
3. Sugestões para explorar novos gêneros ou filmes similares
4. Comentários sobre a diversidade do que foi assistido

Seja conciso mas informativo, com tom amigável e encorajador.
`;

        const analysisResult =
          await env.DECO_CHAT_WORKSPACE_API.AI_GENERATE_OBJECT({
            messages: [
              {
                role: "user",
                content: analysisPrompt,
              },
            ],
            schema: {
              type: "object",
              properties: {
                analysis: {
                  type: "string",
                  description: "Análise detalhada das preferências do usuário",
                },
                recommendations: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  description: "Lista de recomendações personalizadas",
                },
              },
              required: ["analysis", "recommendations"],
            },
          });

        const result: {
          analysis: string;
          genreStats: Array<{
            genre: string;
            count: number;
            averageRating: number;
            percentage: number;
          }>;
          ratingStats: {
            averageRating: number;
            totalMovies: number;
            highlyRated: number;
            mediumRated: number;
            lowRated: number;
          };
          recommendations: string[];
        } = {
          analysis: String(
            analysisResult.object?.analysis || "Análise não disponível"
          ),
          genreStats,
          ratingStats: {
            averageRating,
            totalMovies: watchedMovies.length,
            highlyRated,
            mediumRated,
            lowRated,
          },
          recommendations: Array.isArray(analysisResult.object?.recommendations)
            ? analysisResult.object.recommendations.map(String)
            : [
                "Continue explorando diferentes gêneros",
                "Experimente filmes com avaliações altas",
              ],
        };

        return result;
      } catch (error) {
        console.error("Erro ao analisar filmes assistidos:", error);
        throw new Error("Falha ao analisar filmes assistidos");
      }
    },
  });

/**
 * `createPrivateTool` is a wrapper around `createTool` that
 * will call `env.DECO_CHAT_REQUEST_CONTEXT.ensureAuthenticated`
 * before executing the tool.
 *
 * It automatically returns a 401 error if valid user credentials
 * are not present in the request. You can also call it manually
 * to get the user object.
 */
export const createGetUserTool = (env: Env) =>
  createTool({
    id: "GET_USER",
    description: "Get the current logged in user",
    inputSchema: z.object({}),
    outputSchema: z.object({
      id: z.string(),
      name: z.string().nullable(),
      avatar: z.string().nullable(),
      email: z.string(),
    }),
    execute: async () => {
      const user = env.DECO_CHAT_REQUEST_CONTEXT.ensureAuthenticated();

      if (!user) {
        throw new Error("User not found");
      }

      return {
        id: user.id,
        name: user.user_metadata.full_name,
        avatar: user.user_metadata.avatar_url,
        email: user.email,
      };
    },
  });

/**
 * This tool is declared as public and can be executed by anyone
 * that has access to your MCP server.
 */
export const createListTodosTool = (env: Env) =>
  createTool({
    id: "LIST_TODOS",
    description: "List all todos",
    inputSchema: z.object({}),
    outputSchema: z.object({
      todos: z.array(
        z.object({
          id: z.number(),
          title: z.string().nullable(),
          completed: z.boolean(),
        })
      ),
    }),
    execute: async () => {
      const db = await getDb(env);
      const todos = await db.select().from(todosTable);
      return {
        todos: todos.map((todo) => ({
          ...todo,
          completed: todo.completed === 1,
        })),
      };
    },
  });

const TODO_GENERATION_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "The title of the todo",
    },
  },
  required: ["title"],
};

export const createGenerateTodoWithAITool = (env: Env) =>
  createTool({
    id: "GENERATE_TODO_WITH_AI",
    description: "Generate a todo with AI",
    inputSchema: z.object({}),
    outputSchema: z.object({
      todo: z.object({
        id: z.number(),
        title: z.string().nullable(),
        completed: z.boolean(),
      }),
    }),
    execute: async () => {
      const db = await getDb(env);
      const generatedTodo =
        await env.DECO_CHAT_WORKSPACE_API.AI_GENERATE_OBJECT({
          model: "openai:gpt-4.1-mini",
          messages: [
            {
              role: "user",
              content:
                "Generate a funny TODO title that i can add to my TODO list! Keep it short and sweet, a maximum of 10 words.",
            },
          ],
          temperature: 0.9,
          schema: TODO_GENERATION_SCHEMA,
        });

      const generatedTodoTitle = String(generatedTodo.object?.title);

      if (!generatedTodoTitle) {
        throw new Error("Failed to generate todo");
      }

      const todo = await db
        .insert(todosTable)
        .values({
          title: generatedTodoTitle,
          completed: 0,
        })
        .returning({ id: todosTable.id });

      return {
        todo: {
          id: todo[0].id,
          title: generatedTodoTitle,
          completed: false,
        },
      };
    },
  });

export const createToggleTodoTool = (env: Env) =>
  createTool({
    id: "TOGGLE_TODO",
    description: "Toggle a todo's completion status",
    inputSchema: z.object({
      id: z.number(),
    }),
    outputSchema: z.object({
      todo: z.object({
        id: z.number(),
        title: z.string().nullable(),
        completed: z.boolean(),
      }),
    }),
    execute: async ({ context }) => {
      const db = await getDb(env);

      // First get the current todo
      const currentTodo = await db
        .select()
        .from(todosTable)
        .where(eq(todosTable.id, context.id))
        .limit(1);

      if (currentTodo.length === 0) {
        throw new Error("Todo not found");
      }

      // Toggle the completed status
      const newCompletedStatus = currentTodo[0].completed === 1 ? 0 : 1;

      const updatedTodo = await db
        .update(todosTable)
        .set({ completed: newCompletedStatus })
        .where(eq(todosTable.id, context.id))
        .returning();

      return {
        todo: {
          id: updatedTodo[0].id,
          title: updatedTodo[0].title,
          completed: updatedTodo[0].completed === 1,
        },
      };
    },
  });

export const createDeleteTodoTool = (env: Env) =>
  createTool({
    id: "DELETE_TODO",
    description: "Delete a todo",
    inputSchema: z.object({
      id: z.number(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      deletedId: z.number(),
    }),
    execute: async ({ context }) => {
      const db = await getDb(env);

      // First check if the todo exists
      const existingTodo = await db
        .select()
        .from(todosTable)
        .where(eq(todosTable.id, context.id))
        .limit(1);

      if (existingTodo.length === 0) {
        throw new Error("Todo not found");
      }

      // Delete the todo
      await db.delete(todosTable).where(eq(todosTable.id, context.id));

      return {
        success: true,
        deletedId: context.id,
      };
    },
  });

export const tools = [
  createRecommendMovieTool,
  createSetTmdbApiKeyTool,
  createListMovieGenresTool,
  createGetMovieReviewsTool,
  createSaveRecommendedMovieTool,
  createGetRecommendedMoviesTool,
  createAddWatchedMovieTool,
  createRemoveWatchedMovieTool,
  createGetWatchedMoviesTool,
  createUpdateMovieRatingTool,
  createSuggestGenresTool,
  createAnalyzeWatchedMoviesTool,
  createGetUserTool,
  createListTodosTool,
  createGenerateTodoWithAITool,
  createToggleTodoTool,
  createDeleteTodoTool,
];
