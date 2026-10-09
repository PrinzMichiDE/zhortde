import { describe, it, expect } from 'vitest';
import {
  SPLASH_ANIMATIONS,
  SPLASH_CATEGORIES,
  SplashAnimation,
} from '@/lib/splash-animations';

describe('SPLASH_ANIMATIONS', () => {
  it('is an array with items', () => {
    expect(Array.isArray(SPLASH_ANIMATIONS)).toBe(true);
    expect(SPLASH_ANIMATIONS.length).toBeGreaterThan(0);
  });

  it('each animation has required fields', () => {
    SPLASH_ANIMATIONS.forEach((anim) => {
      expect(anim.id).toBeDefined();
      expect(typeof anim.id).toBe('string');
      expect(anim.name).toBeDefined();
      expect(typeof anim.name).toBe('string');
      expect(anim.description).toBeDefined();
      expect(typeof anim.description).toBe('string');
      expect(anim.category).toBeDefined();
      expect(['minimal', 'dynamic', 'creative', 'professional']).toContain(
        anim.category
      );
      expect(anim.preview).toBeDefined();
      expect(typeof anim.preview).toBe('string');
      expect(anim.html).toBeDefined();
      expect(typeof anim.html).toBe('string');
    });
  });

  it('all animations have non-empty IDs', () => {
    SPLASH_ANIMATIONS.forEach((anim) => {
      expect(anim.id.length).toBeGreaterThan(0);
    });
  });

  it('all animations have non-empty names', () => {
    SPLASH_ANIMATIONS.forEach((anim) => {
      expect(anim.name.length).toBeGreaterThan(0);
    });
  });

  it('all animations have non-empty HTML', () => {
    SPLASH_ANIMATIONS.forEach((anim) => {
      expect(anim.html.trim().length).toBeGreaterThan(0);
    });
  });

  it('all IDs are unique', () => {
    const ids = SPLASH_ANIMATIONS.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('minimal category animations exist', () => {
    const minimal = SPLASH_ANIMATIONS.filter(
      (a) => a.category === 'minimal'
    );
    expect(minimal.length).toBeGreaterThan(0);
    minimal.forEach((anim) => {
      expect(anim.id).toBeDefined();
    });
  });

  it('dynamic category animations exist', () => {
    const dynamic = SPLASH_ANIMATIONS.filter(
      (a) => a.category === 'dynamic'
    );
    expect(dynamic.length).toBeGreaterThan(0);
  });

  it('creative category animations exist', () => {
    const creative = SPLASH_ANIMATIONS.filter(
      (a) => a.category === 'creative'
    );
    expect(creative.length).toBeGreaterThan(0);
  });

  it('professional category animations exist', () => {
    const professional = SPLASH_ANIMATIONS.filter(
      (a) => a.category === 'professional'
    );
    expect(professional.length).toBeGreaterThan(0);
  });
});

describe('SPLASH_CATEGORIES', () => {
  it('contains all four expected categories', () => {
    expect(SPLASH_CATEGORIES).toContain('minimal');
    expect(SPLASH_CATEGORIES).toContain('dynamic');
    expect(SPLASH_CATEGORIES).toContain('creative');
    expect(SPLASH_CATEGORIES).toContain('professional');
  });

  it('has exactly four categories', () => {
    expect(SPLASH_CATEGORIES.length).toBe(4);
  });

  it('categories match animation distribution', () => {
    const usedCategories = new Set(
      SPLASH_ANIMATIONS.map((a) => a.category)
    );
    SPLASH_CATEGORIES.forEach((cat) => {
      expect(usedCategories).toContain(cat);
    });
  });
});

describe('animation structure', () => {
  it('contains expected pulse-circle animation', () => {
    const pulse = SPLASH_ANIMATIONS.find((a) => a.id === 'pulse-circle');
    expect(pulse).toBeDefined();
    expect(pulse!.name).toBe('Pulse Circle');
    expect(pulse!.category).toBe('minimal');
  });

  it('animations contain CSS in HTML string', () => {
    SPLASH_ANIMATIONS.forEach((anim) => {
      expect(anim.html).toContain('<style>');
    });
  });

  it('animations contain splash container div', () => {
    SPLASH_ANIMATIONS.forEach((anim) => {
      expect(anim.html).toContain('splash-container');
    });
  });

  it('animations contain splash title element', () => {
    SPLASH_ANIMATIONS.forEach((anim) => {
      expect(anim.html).toContain('splash-title');
    });
  });
});