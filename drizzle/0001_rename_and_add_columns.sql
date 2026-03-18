ALTER TABLE incidents RENAME COLUMN economic_loss TO estimated_cost;
ALTER TABLE incidents ADD COLUMN work_days_lost INTEGER DEFAULT 0;
