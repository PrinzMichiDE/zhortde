import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getUserTags, getTagsForLinks } from './link-tags';

const { db, tagRows, whereCalls } = vi.hoisted(() => {
  const rows: Array<{
    id: number;
    linkId: number;
    tag: string;
    color: string | null;
  }> = [];
  const whereCalls: Array<unknown> = [];
  const where = async (condition: unknown) => {
    whereCalls.push(condition);
    return [...rows];
  };
  return {
    tagRows: rows,
    whereCalls,
    db: {
      select: () => ({
        from: () => ({
          innerJoin: () => ({ where }),
          where,
        }),
      }),
    },
  };
});

vi.mock('./db', () => ({ db }));

beforeEach(() => {
  tagRows.length = 0;
  whereCalls.length = 0;
});

describe('getUserTags', () => {
  it('returns unique tags owned by the user', async () => {
    tagRows.push(
      { id: 1, linkId: 10, tag: 'marketing', color: '#6366f1' },
      { id: 2, linkId: 11, tag: 'ads', color: '#f59e0b' },
      { id: 3, linkId: 12, tag: 'marketing', color: '#6366f1' }, // duplicate name
    );

    const tags = await getUserTags(7);

    expect(tags).toHaveLength(2);
    // duplicate tag names are de-duplicated
    expect(tags.map((t) => t.tag).sort()).toEqual(['ads', 'marketing']);
  });

  it('returns an empty list when the user has no tags', async () => {
    const tags = await getUserTags(7);
    expect(tags).toEqual([]);
  });
});

describe('getTagsForLinks', () => {
  it('returns a map of linkId to tags', async () => {
    tagRows.push(
      { id: 1, linkId: 10, tag: 'a', color: '#6366f1' },
      { id: 2, linkId: 10, tag: 'b', color: '#f59e0b' },
      { id: 3, linkId: 11, tag: 'c', color: '#3b82f6' },
    );

    const map = await getTagsForLinks([10, 11]);

    expect(map.get(10)?.map((t) => t.tag)).toEqual(['a', 'b']);
    expect(map.get(11)?.map((t) => t.tag)).toEqual(['c']);
    expect(map.get(12)).toBeUndefined();
  });

  it('returns an empty map for an empty link id list without querying', async () => {
    const map = await getTagsForLinks([]);
    expect(map.size).toBe(0);
    expect(whereCalls.length).toBe(0);
  });
});