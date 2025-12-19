import { Router, Request, Response } from 'express';
import database from '../utils/database';

const router = Router();

// Save feedback note - No authentication required for client testing
router.post('/notes', async (req: Request, res: Response) => {
  try {
    const {
      sessionId,
      pageName = 'plant-balance',
      sectionName,
      noteContent,
      clientName,
      clientEmail
    } = req.body;

    // Validate required fields
    if (!sessionId || !sectionName || !noteContent) {
      return res.status(400).json({
        error: 'Missing required fields: sessionId, sectionName, and noteContent are required'
      });
    }

    // Insert feedback note into database
    const query = `
      INSERT INTO feedback_notes (
        session_id, page_name, section_name, note_content, client_name, client_email
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [sessionId, pageName, sectionName, noteContent, clientName, clientEmail];
    const result = await database.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Feedback note saved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving feedback note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save feedback note'
    });
  }
  return;
});

// Get all feedback notes for a session
router.get('/notes/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const query = `
      SELECT * FROM feedback_notes
      WHERE session_id = $1
      ORDER BY created_at DESC
    `;

    const result = await database.query(query, [sessionId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching feedback notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback notes'
    });
  }
});

// Get all feedback notes (admin view)
router.get('/notes', async (req: Request, res: Response) => {
  try {
    const { page, limit = 50 } = req.query;

    let query = `
      SELECT * FROM feedback_notes
    `;

    const values: any[] = [];

    if (page) {
      query += ' WHERE page_name = $1';
      values.push(page);
    }

    query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit as string) || 50}`;

    const result = await database.query(query, values);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching all feedback notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback notes'
    });
  }
});

// Delete a specific feedback note (admin only - should add auth middleware in production)
router.delete('/notes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const query = `
      DELETE FROM feedback_notes
      WHERE id = $1
      RETURNING *
    `;

    const result = await database.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Feedback note not found'
      });
    }

    res.json({
      success: true,
      message: 'Feedback note deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting feedback note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete feedback note'
    });
  }
  return;
});

// Delete all feedback notes for a session (admin only)
router.delete('/notes/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const query = `
      DELETE FROM feedback_notes
      WHERE session_id = $1
      RETURNING *
    `;

    const result = await database.query(query, [sessionId]);

    res.json({
      success: true,
      message: `Deleted ${result.rowCount} feedback notes from session`,
      deletedCount: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    console.error('Error deleting session feedback notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete session feedback notes'
    });
  }
});

// Export feedback notes as JSON
router.get('/notes/export/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const query = `
      SELECT section_name, note_content, client_name, created_at
      FROM feedback_notes
      WHERE session_id = $1
      ORDER BY created_at ASC
    `;

    const result = await database.query(query, [sessionId]);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="feedback-${sessionId}.json"`);

    res.json({
      sessionId,
      exportDate: new Date().toISOString(),
      notes: result.rows
    });
  } catch (error) {
    console.error('Error exporting feedback notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export feedback notes'
    });
  }
});

export default router;