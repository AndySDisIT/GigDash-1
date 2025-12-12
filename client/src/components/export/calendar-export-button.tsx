import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CalendarExportButtonProps {
  gigIds: string[];
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function CalendarExportButton({ gigIds, variant = "outline", size = "default" }: CalendarExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [calendarName, setCalendarName] = useState("GigConnect Schedule");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (gigIds.length === 0) {
      toast({
        title: "No Gigs Selected",
        description: "Please select at least one gig to export",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/calendar/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gigIds, calendarName }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download the ICS file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'calendar.ics';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Calendar Exported",
        description: `${gigIds.length} gigs exported to calendar file`,
      });

      setOpen(false);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export calendar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} data-testid="button-export-calendar">
          <Calendar className="w-4 h-4 mr-2" />
          Export to Calendar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export to Calendar</DialogTitle>
          <DialogDescription>
            Download an ICS file to import into your calendar app
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="calendar-name">Calendar Name</Label>
            <Input
              id="calendar-name"
              value={calendarName}
              onChange={(e) => setCalendarName(e.target.value)}
              placeholder="GigConnect Schedule"
              data-testid="input-calendar-name"
            />
          </div>
          <div className="text-sm text-slate-600">
            <p>Exporting {gigIds.length} gig{gigIds.length !== 1 ? 's' : ''}</p>
            <p className="mt-2 text-xs">
              The exported file can be imported into Google Calendar, Apple Calendar, Outlook, and other calendar apps.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={loading} data-testid="button-download-calendar">
            <Download className="w-4 h-4 mr-2" />
            {loading ? 'Exporting...' : 'Download ICS File'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
