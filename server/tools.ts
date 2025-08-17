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
} from "./schema.ts";

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
      const db = await getDb(env);
      // Busca a chave no banco
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
      let url =
        "https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&language=pt-BR&include_video=true&with_watch_providers=8|119|9|220|350|2|3|15|192|531|7|97|384|8|119|9|220|350|2|3|15|192|531|7|97|384";
      // Adiciona gêneros incluídos
      if (context.includeGenreIds && context.includeGenreIds.length > 0) {
        url += `&with_genres=${context.includeGenreIds.join(",")}`;
      }
      // Adiciona gêneros excluídos
      if (context.excludeGenreIds && context.excludeGenreIds.length > 0) {
        url += `&without_genres=${context.excludeGenreIds.join(",")}`;
      }
      let fetchOptions: RequestInit = {};
      if (apiKey.startsWith("eyJ")) {
        // Token v4
        fetchOptions.headers = {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        };
      } else {
        // API Key v3
        url += `&api_key=${apiKey}`;
      }
      const res = await fetch(url, fetchOptions);
      let errorBody = "";
      if (!res.ok) {
        try {
          errorBody = await res.text();
        } catch {}
        throw new Error(
          `TMDB API error: ${res.status} ${res.statusText} - ${errorBody}`
        );
      }
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
        const genresUrl = apiKey.startsWith("eyJ")
          ? `https://api.themoviedb.org/3/movie/${movie.id}?language=pt-BR`
          : `https://api.themoviedb.org/3/movie/${movie.id}?language=pt-BR&api_key=${apiKey}`;

        const genresFetchOptions: RequestInit = apiKey.startsWith("eyJ")
          ? {
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
            }
          : {};

        const genresRes = await fetch(genresUrl, genresFetchOptions);
        if (genresRes.ok) {
          const movieData = await genresRes.json();
          genres = movieData.genres?.map((g: any) => g.name) || [];
        }
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
        const videosUrl = apiKey.startsWith("eyJ")
          ? `https://api.themoviedb.org/3/movie/${movie.id}/videos?language=pt-BR`
          : `https://api.themoviedb.org/3/movie/${movie.id}/videos?language=pt-BR&api_key=${apiKey}`;

        const videosFetchOptions: RequestInit = apiKey.startsWith("eyJ")
          ? {
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
            }
          : {};

        const videosRes = await fetch(videosUrl, videosFetchOptions);
        if (videosRes.ok) {
          const videosData = await videosRes.json();
          videos =
            videosData.results?.filter(
              (v: any) => v.site === "YouTube" && v.type === "Trailer"
            ) || [];
        }
      } catch (error) {
        console.error("Erro ao buscar vídeos do filme:", error);
      }

      // Buscar provedores de streaming do filme
      let watchProviders: any = {};
      try {
        const providersUrl = apiKey.startsWith("eyJ")
          ? `https://api.themoviedb.org/3/movie/${movie.id}/watch/providers`
          : `https://api.themoviedb.org/3/movie/${movie.id}/watch/providers?api_key=${apiKey}`;

        const providersFetchOptions: RequestInit = apiKey.startsWith("eyJ")
          ? {
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
            }
          : {};

        const providersRes = await fetch(providersUrl, providersFetchOptions);
        if (providersRes.ok) {
          const providersData = await providersRes.json();
          // Buscar provedores do Brasil (BR)
          const brProviders = providersData.results?.BR;
          if (brProviders) {
            watchProviders = {
              flatrate:
                brProviders.flatrate?.map((p: any) => ({
                  provider_name: p.provider_name,
                  logo_path: p.logo_path
                    ? `https://image.tmdb.org/t/p/original${p.logo_path}`
                    : undefined,
                })) || [],
              rent:
                brProviders.rent?.map((p: any) => ({
                  provider_name: p.provider_name,
                  logo_path: p.logo_path
                    ? `https://image.tmdb.org/t/p/original${p.logo_path}`
                    : undefined,
                })) || [],
              buy:
                brProviders.buy?.map((p: any) => ({
                  provider_name: p.provider_name,
                  logo_path: p.logo_path
                    ? `https://image.tmdb.org/t/p/original${p.logo_path}`
                    : undefined,
                })) || [],
            };
          }
        }
      } catch (error) {
        console.error("Erro ao buscar provedores de streaming:", error);
      }

      // Salvar filme recomendado no banco
      try {
        await db.insert(recommendedMoviesTable).values({
          movieId: movieResult.movieId,
          title: movieResult.title,
          poster: movieResult.posterUrl || null,
          genres: genres.length > 0 ? JSON.stringify(genres) : null,
          createdAt: new Date(),
        });
      } catch (error) {
        console.error("Erro ao salvar filme recomendado:", error);
        // Não falhar se não conseguir salvar
      }

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
      const db = await getDb(env);
      // Busca a chave no banco
      const apiKeyRow = await db
        .select()
        .from(tmdbApiKeyTable)
        .where(eq(tmdbApiKeyTable.id, 1));
      console.log("LIST_MOVIE_GENRES - API Key Row:", apiKeyRow);
      const apiKey = apiKeyRow[0]?.apiKey;
      console.log("LIST_MOVIE_GENRES - API Key found:", apiKey ? "YES" : "NO");
      if (!apiKey) {
        throw new Error(
          "TMDB API key not configured. Use SET_TMDB_API_KEY para configurar."
        );
      }
      let url = "https://api.themoviedb.org/3/genre/movie/list?language=pt-BR";
      let fetchOptions: RequestInit = {};
      if (apiKey.startsWith("eyJ")) {
        // Token v4
        fetchOptions.headers = {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        };
      } else {
        // API Key v3
        url += `&api_key=${apiKey}`;
      }
      const res = await fetch(url, fetchOptions);
      let errorBody = "";
      if (!res.ok) {
        try {
          errorBody = await res.text();
        } catch {}
        throw new Error(
          `TMDB API error: ${res.status} ${res.statusText} - ${errorBody}`
        );
      }
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
      const db = await getDb(env);
      // Busca a chave no banco
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

      // Buscar reviews do filme
      let url = `https://api.themoviedb.org/3/movie/${context.movieId}/reviews?language=pt-BR&page=1`;
      let fetchOptions: RequestInit = {};
      if (apiKey.startsWith("eyJ")) {
        // Token v4
        fetchOptions.headers = {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        };
      } else {
        // API Key v3
        url += `&api_key=${apiKey}`;
      }

      const res = await fetch(url, fetchOptions);
      if (!res.ok) {
        throw new Error(`TMDB API error: ${res.status}`);
      }

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
            genres: movie.genres ? JSON.parse(movie.genres) : [],
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

      try {
        // Verificar se já existe
        const existing = await db
          .select()
          .from(watchedMoviesTable)
          .where(eq(watchedMoviesTable.movieId, context.movieId))
          .limit(1);

        if (existing.length > 0) {
          throw new Error("Filme já está na lista de assistidos");
        }

        const result = await db
          .insert(watchedMoviesTable)
          .values({
            movieId: context.movieId,
            title: context.title,
            poster: context.poster || null,
            genres: context.genres ? JSON.stringify(context.genres) : null,
            createdAt: new Date(),
          })
          .returning({ id: watchedMoviesTable.id });

        return {
          success: true,
          id: result[0].id,
        };
      } catch (error) {
        console.error("Erro ao adicionar filme assistido:", error);
        throw new Error("Falha ao adicionar filme assistido");
      }
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

      try {
        await db
          .delete(watchedMoviesTable)
          .where(eq(watchedMoviesTable.movieId, context.movieId));

        return {
          success: true,
        };
      } catch (error) {
        console.error("Erro ao remover filme assistido:", error);
        throw new Error("Falha ao remover filme assistido");
      }
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

      try {
        const movies = await db
          .select()
          .from(watchedMoviesTable)
          .orderBy(watchedMoviesTable.createdAt);

        return {
          movies: movies.map((movie) => ({
            id: movie.id,
            movieId: movie.movieId,
            title: movie.title,
            poster: movie.poster,
            genres: movie.genres ? JSON.parse(movie.genres) : [],
            rating: movie.rating,
            createdAt: movie.createdAt
              ? new Date(movie.createdAt).toISOString()
              : new Date().toISOString(),
          })),
        };
      } catch (error) {
        console.error("Erro ao buscar filmes assistidos:", error);
        throw new Error("Falha ao buscar filmes assistidos");
      }
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
      const existingMovie = await db
        .select()
        .from(watchedMoviesTable)
        .where(eq(watchedMoviesTable.movieId, context.movieId))
        .limit(1);

      if (existingMovie.length === 0) {
        throw new Error("Filme não encontrado na lista de assistidos");
      }

      // Atualizar a avaliação
      await db
        .update(watchedMoviesTable)
        .set({ rating: context.rating })
        .where(eq(watchedMoviesTable.movieId, context.movieId));

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
      const watchedMovies = await db
        .select()
        .from(watchedMoviesTable)
        .orderBy(desc(watchedMoviesTable.createdAt));

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
            const genres = JSON.parse(movie.genres);
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
  const db = await getDb(env);
  const apiKeyRow = await db
    .select()
    .from(tmdbApiKeyTable)
    .where(eq(tmdbApiKeyTable.id, 1));
  const apiKey = apiKeyRow[0]?.apiKey;

  if (!apiKey) {
    throw new Error("TMDB API key not configured");
  }

  let url = "https://api.themoviedb.org/3/genre/movie/list?language=pt-BR";
  let fetchOptions: RequestInit = {};

  if (apiKey.startsWith("eyJ")) {
    fetchOptions.headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
  } else {
    url += `&api_key=${apiKey}`;
  }

  const res = await fetch(url, fetchOptions);
  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status}`);
  }

  const data = await res.json();
  return data.genres || [];
}

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
];
