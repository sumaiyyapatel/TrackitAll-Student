import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function InlineEditable({
  value: initialValue = '',
  onSave,
  inputType = 'text',
  multiline = false,
  className = ''
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue ?? '');
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setValue(initialValue ?? '');
  }, [initialValue]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
    }
  }, [editing]);

  const handleCancel = () => {
    setValue(initialValue ?? '');
    setEditing(false);
  };

  const handleSave = async () => {
    if (!onSave) {
      setEditing(false);
      return;
    }

    try {
      setLoading(true);
      await onSave(value);
      toast.success('Saved');
      setEditing(false);
    } catch (err) {
      console.error('Inline save failed', err);
      toast.error('Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`inline-editable ${className}`}>
      {!editing ? (
        <div className="flex items-center gap-3">
          <div className="truncate text-foreground">{initialValue || <span className="text-muted-foreground">(empty)</span>}</div>
          <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="text-foreground">
            Edit
          </Button>
        </div>
      ) : (
        <div className="flex items-start gap-3 w-full">
          {multiline ? (
            <Textarea
              ref={ref}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="bg-background border-border text-foreground flex-1"
              rows={4}
            />
          ) : (
            <Input
              ref={ref}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              type={inputType}
              className="bg-background border-border text-foreground flex-1"
            />
          )}

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
