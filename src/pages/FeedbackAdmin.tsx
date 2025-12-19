import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import Layout from '../components/layout/Layout';
import { Download, RefreshCw, Calendar, User, MessageSquare, Trash2, AlertCircle } from 'lucide-react';

interface FeedbackNote {
  id: number;
  session_id: string;
  page_name: string;
  section_name: string;
  note_content: string;
  client_name?: string;
  client_email?: string;
  created_at: string;
  updated_at: string;
}

const FeedbackAdmin: React.FC = () => {
  const [notes, setNotes] = useState<FeedbackNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [groupBySession, setGroupBySession] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'note' | 'session'; id: string } | null>(null);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/feedback/notes?page=plant-balance&limit=100`
      );
      if (response.ok) {
        const data = await response.json();
        setNotes(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching feedback notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const exportAllNotes = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `feedback-notes-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportSessionNotes = (sessionId: string) => {
    const sessionNotes = notes.filter(n => n.session_id === sessionId);
    const dataStr = JSON.stringify(sessionNotes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `feedback-${sessionId}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const deleteNote = async (noteId: string) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/feedback/notes/${noteId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setNotes(notes.filter(n => n.id.toString() !== noteId));
        setDeleteConfirm(null);
      } else {
        console.error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/feedback/notes/session/${sessionId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setNotes(notes.filter(n => n.session_id !== sessionId));
        setDeleteConfirm(null);
      } else {
        console.error('Failed to delete session notes');
      }
    } catch (error) {
      console.error('Error deleting session notes:', error);
    }
  };

  // Group notes by session
  const notesBySession = notes.reduce((acc, note) => {
    if (!acc[note.session_id]) {
      acc[note.session_id] = [];
    }
    acc[note.session_id].push(note);
    return acc;
  }, {} as Record<string, FeedbackNote[]>);

  // Sidebar content for admin
  const sidebarContent = (
    <div className="p-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Feedback Statistics
      </h3>
      <div className="space-y-3">
        <div className="bg-card rounded-lg p-3 border">
          <p className="text-xs text-muted-foreground font-medium mb-1">Total Notes:</p>
          <p className="text-lg font-bold text-foreground">{notes.length}</p>
        </div>

        <div className="bg-card rounded-lg p-3 border">
          <p className="text-xs text-muted-foreground font-medium mb-1">Unique Sessions:</p>
          <p className="text-lg font-bold text-foreground">{Object.keys(notesBySession).length}</p>
        </div>

        <div className="bg-card rounded-lg p-3 border">
          <p className="text-xs text-muted-foreground font-medium mb-1">Most Recent:</p>
          <p className="text-xs text-foreground">
            {notes[0] ? new Date(notes[0].created_at).toLocaleDateString() : 'No notes yet'}
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <Button
            onClick={exportAllNotes}
            size="sm"
            className="w-full"
            disabled={notes.length === 0}
          >
            <Download className="h-3 w-3 mr-2" />
            Export All Notes
          </Button>

          <Button
            onClick={fetchNotes}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout sidebarContent={sidebarContent}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Feedback Notes Admin
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            View and export client feedback from the Plant Balance Calculator
          </p>
        </div>

        {/* View Toggle */}
        <div className="mb-4 flex gap-2">
          <Button
            variant={groupBySession ? 'default' : 'outline'}
            onClick={() => setGroupBySession(true)}
            size="sm"
          >
            Group by Session
          </Button>
          <Button
            variant={!groupBySession ? 'default' : 'outline'}
            onClick={() => setGroupBySession(false)}
            size="sm"
          >
            All Notes
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">Loading feedback notes...</p>
            </CardContent>
          </Card>
        ) : notes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-600">No feedback notes yet.</p>
              <p className="text-sm text-gray-500 mt-2">
                Notes will appear here when clients add feedback to the Plant Balance Calculator.
              </p>
            </CardContent>
          </Card>
        ) : groupBySession ? (
          // Session-grouped view
          <div className="space-y-4">
            {Object.entries(notesBySession).map(([sessionId, sessionNotes]) => (
              <Card key={sessionId} className="overflow-hidden">
                <CardHeader className="bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Session: {sessionId.substring(0, 20)}...
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(sessionNotes[0].created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {sessionNotes.length} notes
                        </span>
                        {sessionNotes[0].client_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {sessionNotes[0].client_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => exportSessionNotes(sessionId)}
                        size="sm"
                        variant="outline"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                      <Button
                        onClick={() => setDeleteConfirm({ type: 'session', id: sessionId })}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete Session
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {sessionNotes.map((note) => (
                      <div key={note.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {note.section_name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {new Date(note.created_at).toLocaleTimeString()}
                            </span>
                            <Button
                              onClick={() => setDeleteConfirm({ type: 'note', id: note.id.toString() })}
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {note.note_content}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // All notes view
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {note.section_name}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          Session: {note.session_id.substring(0, 15)}...
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {new Date(note.created_at).toLocaleString()}
                        </span>
                        <Button
                          onClick={() => setDeleteConfirm({ type: 'note', id: note.id.toString() })}
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {note.note_content}
                    </p>
                    {note.client_name && (
                      <p className="text-xs text-gray-500 mt-2">
                        By: {note.client_name} {note.client_email && `(${note.client_email})`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96 p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Confirm Delete</h3>
                  <p className="text-sm text-gray-600">
                    {deleteConfirm.type === 'note'
                      ? 'Are you sure you want to delete this feedback note? This action cannot be undone.'
                      : `Are you sure you want to delete all feedback notes from this session? This will remove ${notesBySession[deleteConfirm.id]?.length || 0} notes. This action cannot be undone.`}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setDeleteConfirm(null)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (deleteConfirm.type === 'note') {
                      deleteNote(deleteConfirm.id);
                    } else {
                      deleteSession(deleteConfirm.id);
                    }
                  }}
                  variant="destructive"
                  size="sm"
                >
                  Delete
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FeedbackAdmin;