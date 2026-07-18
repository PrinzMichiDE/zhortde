-- Initialize Statistics with Fake Values
-- Insert initial counter values for visitors and links

-- Delete existing stats (if any)
DELETE FROM stats WHERE key IN ('visitors', 'links');

-- Insert initial values
Update stats set value = 267843 where key = 'visitors';
Update stats set value = 71529 where key = 'links';
VALUES 
  ('visitors', 3526819),
  ('links', 54428);

-- Verify
SELECT * FROM stats;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Statistics initialized!';
  RAISE NOTICE 'Visitors: 126,819';
  RAISE NOTICE 'Links: 126,819';
END $$;

