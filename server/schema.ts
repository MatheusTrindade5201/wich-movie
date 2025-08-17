/**
 * This file is used to define the schema for the database.
 *
 * After making changes to this file, run `npm run db:generate` to generate the migration file.
 * Then, by just using the app, the migration is lazily ensured at runtime.
 */
import { integer, sqliteTable, text } from "@deco/workers-runtime/drizzle";

export const tmdbApiKeyTable = sqliteTable("tmdb_api_key", {
  id: integer("id").primaryKey(),
  apiKey: text("api_key").notNull(),
});

// Tabela para filmes recomendados
export const recommendedMoviesTable = sqliteTable("recommended_movies", {
  id: integer("id").primaryKey(),
  movieId: integer("movie_id").notNull(),
  title: text("title").notNull(),
  poster: text("poster"),
  genres: text("genres"), // JSON string dos gêneros
  createdAt: integer("created_at", { mode: "timestamp" }),
});

// Tabela para filmes assistidos
export const watchedMoviesTable = sqliteTable("watched_movies", {
  id: integer("id").primaryKey(),
  movieId: integer("movie_id").notNull(),
  title: text("title").notNull(),
  poster: text("poster"),
  genres: text("genres"), // JSON string dos gêneros
  createdAt: integer("created_at", { mode: "timestamp" }),
});
