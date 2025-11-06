-- Initialize Statistics with Fake Values
-- Insert initial counter values for visitors and links

-- Delete existing stats (if any)
DELETE FROM stats WHERE key IN ('visitors', 'links');

-- Insert initial values
INSERT INTO stats (key, value) 
VALUES 
  ('visitors', 126819),
  ('links', 126819);

-- Verify
SELECT * FROM stats;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Statistics initialized!';
  RAISE NOTICE 'Visitors: 126,819';
  RAISE NOTICE 'Links: 126,819';
END $$;

