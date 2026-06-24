import { Inject, Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DRIZZLE } from '@sanad/database';
import {
  blogPostTagTable,
  type ContentDb,
} from '../../../../db/schema/index.js';

/**
 * The blog post ↔ tag M2M join repository (N1). The join carries no entity state (no id, no
 * soft-delete, no translations), so it does NOT fit the `BaseRepository` entity canon — it is a
 * plain repo injecting `DRIZZLE` directly (the `RbacRepository`/`RefreshTokenRepository`
 * pattern; N1 allows specialized aggregates). All writes are intra-service (no Outbox — MS3
 * applies only across services).
 */
@Injectable()
export class BlogPostTagRepository {
  constructor(@Inject(DRIZZLE) private readonly db: ContentDb) {}

  /**
   * Replace a post's tag set (delete-then-insert in one tx — idempotent: re-applying the same
   * set yields the same rows). Duplicate ids are de-duped. Empty set clears all tags.
   */
  async setTagsFor(postId: string, tagIds: readonly string[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .delete(blogPostTagTable)
        .where(eq(blogPostTagTable.blogPostId, postId));
      const unique = [...new Set(tagIds)];
      if (unique.length > 0) {
        await tx
          .insert(blogPostTagTable)
          .values(
            unique.map((blogTagId) => ({ blogPostId: postId, blogTagId })),
          );
      }
    });
  }

  /** Batch: `postId → tagId[]` for many posts in ONE query (N+1-safe, for the embed). */
  async tagIdsForMany(
    postIds: readonly string[],
  ): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>();
    if (postIds.length === 0) {
      return map;
    }
    const rows = await this.db
      .select()
      .from(blogPostTagTable)
      .where(inArray(blogPostTagTable.blogPostId, [...postIds]));
    for (const row of rows) {
      const list = map.get(row.blogPostId) ?? [];
      list.push(row.blogTagId);
      map.set(row.blogPostId, list);
    }
    return map;
  }
}
