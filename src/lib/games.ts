import { eq, asc, inArray, and } from 'drizzle-orm';
import type { Database } from './db';
import { games, categories, publishers } from '../../db/schema';
import type { Game } from '../types/game';

/**
 * Optional filters that narrow the catalog by category and/or publisher.
 */
export interface GameFilters {
    categoryIds?: number[];
    publisherId?: number | null;
}

const gameSelection = {
    id: games.id,
    title: games.title,
    description: games.description,
    starRating: games.starRating,
    categoryId: categories.id,
    categoryName: categories.name,
    publisherId: publishers.id,
    publisherName: publishers.name,
};

type GameSelectionRow = {
    id: number;
    title: string;
    description: string;
    starRating: number | null;
    categoryId: number | null;
    categoryName: string | null;
    publisherId: number | null;
    publisherName: string | null;
};

function mapGame(row: GameSelectionRow): Game {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        starRating: row.starRating,
        category:
            row.categoryId !== null && row.categoryName !== null
                ? { id: row.categoryId, name: row.categoryName }
                : null,
        publisher:
            row.publisherId !== null && row.publisherName !== null
                ? { id: row.publisherId, name: row.publisherName }
                : null,
    };
}

function baseGamesQuery(db: Database) {
    return db
        .select(gameSelection)
        .from(games)
        .leftJoin(categories, eq(games.categoryId, categories.id))
        .leftJoin(publishers, eq(games.publisherId, publishers.id));
}

/**
 * Applies the optional category and publisher filters to a base games query.
 */
function applyGameFilters(query: ReturnType<typeof baseGamesQuery>, filters: GameFilters = {}) {
    const categoryIds = (filters.categoryIds ?? []).filter((id) => Number.isFinite(id));
    const conditions = [];

    if (categoryIds.length > 0) {
        conditions.push(inArray(games.categoryId, categoryIds));
    }

    if (filters.publisherId !== undefined && filters.publisherId !== null) {
        conditions.push(eq(games.publisherId, filters.publisherId));
    }

    if (conditions.length > 0) {
        return query.where(and(...conditions));
    }

    return query;
}

/**
 * Returns every game in alphabetical title order, optionally narrowed by category and publisher filters.
 */
export async function getAllGames(db: Database, filters: GameFilters = {}): Promise<Game[]> {
    const rows = await applyGameFilters(baseGamesQuery(db), filters).orderBy(asc(games.title));
    return rows.map(mapGame);
}

/**
 * Lists every category in the catalog, sorted alphabetically for filter controls.
 */
export async function getAllCategories(db: Database): Promise<Array<{ id: number; name: string }>> {
    const rows = await db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.name));
    return rows;
}

/**
 * Lists every publisher in the catalog, sorted alphabetically for filter controls.
 */
export async function getAllPublishers(db: Database): Promise<Array<{ id: number; name: string }>> {
    const rows = await db.select({ id: publishers.id, name: publishers.name }).from(publishers).orderBy(asc(publishers.name));
    return rows;
}

/** All game ids ordered by title. */
export async function getAllGameIds(db: Database): Promise<number[]> {
    const rows = await db.select({ id: games.id }).from(games).orderBy(asc(games.title));
    return rows.map((row) => row.id);
}

/** A single game by id, or null when it does not exist. */
export async function getGameById(db: Database, id: number): Promise<Game | null> {
    const row = await baseGamesQuery(db).where(eq(games.id, id)).get();
    return row ? mapGame(row) : null;
}
