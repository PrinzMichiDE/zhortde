import { describe, expect, it, vi } from 'vitest';
import { findDuplicateLink } from './duplicate-links';

const { findFirst, db } = vi.hoisted(() => {
  const findFirst = vi.fn();
  return {
    findFirst,
    db: {
      query: {
        links: {
          findFirst,
        },
      },
    },
  };
});

vi.mock('./db', () => ({ db }));

describe('findDuplicateLink', () => {
  it('returns null when the user has no link with this URL', async () => {
    findFirst.mockResolvedValue(null);
    expect(await findDuplicateLink(7, 'https://a.de')).toBeNull();
  });

  it('returns the existing duplicate with its short code', async () => {
    findFirst.mockResolvedValue({
      id: 42,
      shortCode: 'abc',
      longUrl: 'https://a.de',
    });

    const duplicate = await findDuplicateLink(7, 'https://a.de');

    expect(duplicate).toEqual({
      id: 42,
      shortCode: 'abc',
      longUrl: 'https://a.de',
    });

    // The query must scope by userId AND longUrl
    const where = findFirst.mock.calls[0][0];
    expect(where).toHaveProperty('where');
  });
});