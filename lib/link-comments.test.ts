import { describe, expect, it, vi } from 'vitest';
import { getLinkComments, addLinkComment, deleteLinkCommentById } from './link-comments';

const { db, findMany, inserted, deletedWhere } = vi.hoisted(() => {
  const findMany = vi.fn();
  const inserted: Array<Record<string, unknown>> = [];
  const deletedWhere = vi.fn();
  return {
    findMany,
    inserted,
    deletedWhere,
    db: {
      query: {
        linkComments: { findMany },
      },
      insert: () => ({
        values: (values: Record<string, unknown>) => {
          inserted.push(values);
          return {
            returning: async () => [
              { id: 1, ...values, createdAt: new Date('2026-01-02T00:00:00.000Z') },
            ],
          };
        },
      }),
      delete: () => ({
        where: deletedWhere,
      }),
    },
  };
});

vi.mock('./db', () => ({ db }));

describe('link comments', () => {
  it('lists comments for a link, newest first', async () => {
    findMany.mockResolvedValue([
      { id: 2, content: 'newer' },
      { id: 1, content: 'older' },
    ]);

    const comments = await getLinkComments(7);
    expect(comments[0].content).toBe('newer');
    expect(findMany.mock.calls[0][0]).toMatchObject({
      orderBy: expect.any(Array),
    });
  });

  it('adds an internal note by default', async () => {
    const comment = await addLinkComment({
      linkId: 7,
      userId: 3,
      content: 'Vertrag geprüft',
    });

    expect(comment.id).toBe(1);
    expect(comment.content).toBe('Vertrag geprüft');
    expect(comment.isInternal).toBe(true);
    expect(inserted[0]).toMatchObject({ linkId: 7, userId: 3, isInternal: true });
  });

  it('stores a public comment when isInternal is false', async () => {
    const comment = await addLinkComment({
      linkId: 7,
      userId: 3,
      content: 'öffentlich',
      isInternal: false,
    });

    expect(comment.isInternal).toBe(false);
  });

  it('deletes a comment when the row was affected', async () => {
    deletedWhere.mockReturnValue({ returning: async () => [{ id: 5 }] });
    expect(await deleteLinkCommentById(5)).toBe(true);
    expect(deletedWhere).toHaveBeenCalled();
  });

  it('reports a missing comment as not deleted', async () => {
    deletedWhere.mockReturnValue({ returning: async () => [] });
    expect(await deleteLinkCommentById(99)).toBe(false);
  });
});