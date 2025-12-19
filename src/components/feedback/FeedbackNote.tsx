import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Check, AlertCircle } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface FeedbackNoteProps {
  sectionName: string;
  sessionId: string;
  clientName?: string;
  clientEmail?: string;
  placeholder?: string;
  context?: {
    balanceType?: string;
    timePeriod?: string;
  };
}

const FeedbackNote: React.FC<FeedbackNoteProps> = ({
  sectionName,
  sessionId,
  clientName = '',
  clientEmail = '',
  placeholder = 'Add your feedback or suggestions for this section...',
  context
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

  // Load existing notes for this section
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/feedback/notes/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          const sectionNotes = data.data
            .filter((n: any) => n.section_name === sectionName)
            .map((n: any) => n.note_content);
          setSavedNotes(sectionNotes);
        }
      } catch (error) {
        console.error('Error loading notes:', error);
      }
    };

    if (sessionId) {
      loadNotes();
    }
  }, [sessionId, sectionName]);

  const handleSaveNote = async () => {
    if (!note.trim()) return;

    setIsSaving(true);
    setSaveStatus('idle');

    // Build the full section name with context
    let fullSectionName = sectionName;
    if (context) {
      const contextParts = [];
      if (context.balanceType) {
        const balanceLabel = context.balanceType.charAt(0).toUpperCase() + context.balanceType.slice(1);
        contextParts.push(`Balance: ${balanceLabel}`);
      }
      if (context.timePeriod) {
        const periodLabel = context.timePeriod.replace('-', ' ').split(' ').map((word: string) =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        contextParts.push(`Period: ${periodLabel}`);
      }
      if (contextParts.length > 0) {
        fullSectionName = `${sectionName} [${contextParts.join(', ')}]`;
      }
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/feedback/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          sectionName: fullSectionName,
          noteContent: note,
          clientName,
          clientEmail,
          pageName: 'plant-balance'
        }),
      });

      if (response.ok) {
        setSaveStatus('success');
        setSavedNotes([...savedNotes, note]);
        setNote('');
        setTimeout(() => {
          setSaveStatus('idle');
          setIsOpen(false);
        }, 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error saving note:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      {/* Feedback Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-500 hover:text-gray-700 p-1"
        title="Add feedback note"
      >
        <MessageSquare className="h-4 w-4" />
        {savedNotes.length > 0 && (
          <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
            {savedNotes.length}
          </span>
        )}
      </Button>

      {/* Feedback Form */}
      {isOpen && (
        <Card className="absolute z-10 mt-2 p-4 w-80 shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">Feedback for: {sectionName}</h4>
                {context && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {context.balanceType && (
                      <span className="mr-2">
                        📊 {context.balanceType.charAt(0).toUpperCase() + context.balanceType.slice(1)}
                      </span>
                    )}
                    {context.timePeriod && (
                      <span>
                        ⏱️ {context.timePeriod.replace('-', ' ').split(' ').map((word: string) =>
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            {/* Show existing notes */}
            {savedNotes.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                <p className="text-xs text-gray-500 dark:text-gray-400">Previous notes:</p>
                {savedNotes.map((note, index) => (
                  <div key={index} className="text-xs bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-2 rounded">
                    {note}
                  </div>
                ))}
              </div>
            )}

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={placeholder}
              className="w-full p-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
              rows={3}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {saveStatus === 'success' && (
                  <span className="text-green-600 text-xs flex items-center">
                    <Check className="h-3 w-3 mr-1" /> Saved!
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-red-600 text-xs flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" /> Error saving
                  </span>
                )}
              </div>

              <Button
                onClick={handleSaveNote}
                disabled={!note.trim() || isSaving}
                size="sm"
                className="flex items-center space-x-1"
              >
                {isSaving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Send className="h-3 w-3" />
                    <span>Save Note</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FeedbackNote;