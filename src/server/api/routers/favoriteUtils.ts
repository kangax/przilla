import { eq } from "drizzle-orm";
import { userFavoriteWods } from "~/server/db/schema";
import { type db as mainDb } from "~/server/db/index";

export async function getFavoriteWodIdsByUser(ctx: {
  db: typeof mainDb;
  session: { user: { id: string } };
}): Promise<string[]> {
  const userId = ctx.session.user.id;
  const favorites = await ctx.db
    .select({ wodId: userFavoriteWods.wodId })
    .from(userFavoriteWods)
    .where(eq(userFavoriteWods.userId, userId));
  return favorites.map((fav) => fav.wodId);
}
