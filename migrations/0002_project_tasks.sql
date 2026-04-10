-- Project tasks for kanban board
-- D1 is the live runtime, TypeDB syncs for persistence

CREATE TABLE IF NOT EXISTS project_tasks (
  tid TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'todo',  -- todo, in_progress, complete, blocked, failed
  priority TEXT DEFAULT 'P1',  -- P0, P1, P2, P3
  phase TEXT DEFAULT 'C1',
  value TEXT DEFAULT 'medium',
  persona TEXT DEFAULT 'dev',
  tags TEXT,  -- JSON array
  blocked_by TEXT,  -- JSON array of task IDs
  blocks TEXT,  -- JSON array of task IDs
  trail_pheromone REAL DEFAULT 0,
  alarm_pheromone REAL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_phase ON project_tasks(phase);
