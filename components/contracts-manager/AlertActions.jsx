'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Loader } from 'lucide-react';

/**
 * Alert Actions Component
 * 
 * Provides acknowledge and resolve actions for alerts
 */
export default function AlertActions({ alert, onUpdate }) {
  const [acknowledgeOpen, setAcknowledgeOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');

  const handleAcknowledge = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/v1/alerts/${alert._id}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: notes || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAcknowledgeOpen(false);
        setNotes('');
        onUpdate();
      } else {
        setError(result.error?.message || 'Failed to acknowledge alert');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/v1/alerts/${alert._id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: notes || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setResolveOpen(false);
        setNotes('');
        onUpdate();
      } else {
        setError(result.error?.message || 'Failed to resolve alert');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 pt-2 border-t">
      <Dialog open={acknowledgeOpen} onOpenChange={setAcknowledgeOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Acknowledge
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acknowledge Alert</DialogTitle>
            <DialogDescription>
              Mark this alert as acknowledged. You can add notes about the acknowledgment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="acknowledge-notes">Notes (Optional)</Label>
              <Textarea
                id="acknowledge-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this acknowledgment..."
                rows={3}
                className="mt-2"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcknowledgeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAcknowledge} disabled={loading}>
              {loading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Acknowledging...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Acknowledge
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogTrigger asChild>
          <Button variant="default" size="sm">
            <XCircle className="h-4 w-4 mr-2" />
            Resolve
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              Mark this alert as resolved. You can add notes about the resolution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="resolve-notes">Notes (Optional)</Label>
              <Textarea
                id="resolve-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about how this was resolved..."
                rows={3}
                className="mt-2"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={loading}>
              {loading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Resolve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

