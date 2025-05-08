import { eq } from "drizzle-orm";
import { userFavoriteWods } from "~/server/db/schema";

export async function getFavoriteWodIdsByUser(ctx: {
  db: any;
  session: { user: { id: string } };
}) {
  const userId = ctx.session.user.id;
  const favorites = await ctx.db
    .select({ wodId: userFavoriteWods.wodId })
    .from(userFavoriteWods)
    .where(eq(userFavoriteWods.userId, userId));
  return favorites.map((fav) => fav.wodId);
}
