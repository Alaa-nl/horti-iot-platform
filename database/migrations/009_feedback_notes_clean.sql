CREATE TABLE IF NOT EXISTS feedback_notes (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    page_name VARCHAR(100) DEFAULT 'plant-balance',
    section_name VARCHAR(255) NOT NULL,
    note_content TEXT NOT NULL,
    client_name VARCHAR(100),
    client_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_session ON feedback_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_page ON feedback_notes(page_name);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_feedback_notes_updated_at ON feedback_notes;
CREATE TRIGGER update_feedback_notes_updated_at
    BEFORE UPDATE ON feedback_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();