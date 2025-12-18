import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from './ui/button';

const FeedbackWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Send feedback to your email or save to a service
    const feedbackData = {
      feedback,
      email,
      page: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    // Option 1: Send to a webhook (e.g., Webhook.site, Zapier, Make)
    try {
      await fetch('https://webhook.site/YOUR_WEBHOOK_URL', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      });
    } catch (error) {
      // For now, just log to console
      console.log('Feedback submitted:', feedbackData);
    }

    // Option 2: Copy to clipboard for easy sharing
    navigator.clipboard.writeText(JSON.stringify(feedbackData, null, 2));

    setSubmitted(true);
    setTimeout(() => {
      setIsOpen(false);
      setSubmitted(false);
      setFeedback('');
      setEmail('');
    }, 2000);
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:scale-110 transition-transform"
        aria-label="Leave feedback"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Feedback Form Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-96 bg-card border rounded-lg shadow-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Leave Feedback</h3>

          {submitted ? (
            <div className="text-center py-8">
              <div className="text-green-500 text-5xl mb-4">✓</div>
              <p className="text-lg font-semibold">Thank you for your feedback!</p>
              <p className="text-sm text-muted-foreground mt-2">Copied to clipboard</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Your Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="client@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  rows={4}
                  placeholder="What would you like to change or improve?"
                  required
                />
              </div>

              <div className="text-xs text-muted-foreground">
                Page: {window.location.pathname}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!feedback.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Feedback
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  );
};

export default FeedbackWidget;