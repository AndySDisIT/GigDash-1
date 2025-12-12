/**
 * Calendar Export Service
 * Generates ICS format calendar files for gig schedules
 */

import type { Gig } from "@shared/schema";

export class CalendarExport {
  /**
   * Generate ICS file content for a set of gigs
   */
  generateICS(gigs: Gig[], calendarName: string = "GigConnect Schedule"): string {
    const lines: string[] = [];
    
    // Calendar header
    lines.push('BEGIN:VCALENDAR');
    lines.push('VERSION:2.0');
    lines.push('PRODID:-//GigConnect//Gig Schedule//EN');
    lines.push(`X-WR-CALNAME:${calendarName}`);
    lines.push('X-WR-TIMEZONE:America/New_York');
    lines.push('CALSCALE:GREGORIAN');
    lines.push('METHOD:PUBLISH');
    
    // Add each gig as an event
    for (const gig of gigs) {
      lines.push(...this.generateEvent(gig));
    }
    
    // Calendar footer
    lines.push('END:VCALENDAR');
    
    return lines.join('\r\n');
  }

  /**
   * Generate a single event for a gig
   */
  private generateEvent(gig: Gig): string[] {
    const lines: string[] = [];
    const now = new Date();
    const startDate = new Date(gig.dueDate);
    
    // Calculate end time (start time minus estimated duration)
    const endDate = new Date(startDate);
    const actualStartDate = new Date(startDate.getTime() - (gig.estimatedDuration * 60 * 1000));
    
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const totalPay = parseFloat(gig.payBase) + 
                     parseFloat(gig.tipExpected || "0") + 
                     parseFloat(gig.payBonus || "0");
    
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${gig.id}@gigconnect.app`);
    lines.push(`DTSTAMP:${formatDate(now)}`);
    lines.push(`DTSTART:${formatDate(actualStartDate)}`);
    lines.push(`DTEND:${formatDate(startDate)}`);
    lines.push(`SUMMARY:${this.escapeText(gig.title)}`);
    
    // Description with details
    const description = [
      gig.description || '',
      `Pay: $${totalPay.toFixed(2)}`,
      `Duration: ${gig.estimatedDuration} minutes`,
      gig.travelDistance ? `Travel: ${gig.travelDistance} miles` : '',
      `Priority: ${gig.priority}`,
    ].filter(Boolean).join('\\n');
    
    lines.push(`DESCRIPTION:${this.escapeText(description)}`);
    lines.push(`LOCATION:${this.escapeText(gig.location)}`);
    
    // Add coordinates if available
    if (gig.latitude && gig.longitude) {
      lines.push(`GEO:${gig.latitude};${gig.longitude}`);
    }
    
    // Set alarm 30 minutes before
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-PT30M');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:Gig starting in 30 minutes: ${this.escapeText(gig.title)}`);
    lines.push('END:VALARM');
    
    // Priority mapping
    const priorityValue = gig.priority === 'high' ? '1' : 
                         gig.priority === 'medium' ? '5' : '9';
    lines.push(`PRIORITY:${priorityValue}`);
    
    // Status
    const status = gig.status === 'completed' ? 'CONFIRMED' :
                   gig.status === 'selected' ? 'TENTATIVE' : 'CONFIRMED';
    lines.push(`STATUS:${status}`);
    
    lines.push('END:VEVENT');
    
    return lines;
  }

  /**
   * Escape special characters for ICS format
   */
  private escapeText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  /**
   * Generate filename for ICS download
   */
  generateFilename(prefix: string = 'gigconnect'): string {
    const date = new Date().toISOString().split('T')[0];
    return `${prefix}-schedule-${date}.ics`;
  }
}

export const calendarExport = new CalendarExport();
