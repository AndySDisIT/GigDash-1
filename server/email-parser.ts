import { google } from 'googleapis';
import type { InsertGig } from '@shared/schema';

// Email pattern configurations for different gig platforms
export const GIG_PLATFORM_PATTERNS = {
  gigspot: {
    senders: ['jobs@gigspot.com', 'notifications@gigspot.com', 'confirmations@gigspot.com'],
    available: {
      subjects: ['new shift available', 'shift posted', 'open shift'],
      keywords: ['apply now', 'claim this shift', 'available now'],
    },
    approved: {
      subjects: ['confirmed', 'you\'re booked', 'shift approved', 'you got it'],
      keywords: ['you\'ve been approved', 'confirmed for shift', 'congratulations'],
    },
    completed: {
      subjects: ['shift complete', 'payment sent', 'earnings'],
      keywords: ['payment processed', 'you earned', 'shift finished'],
    },
  },
  qwick: {
    senders: ['notifications@qwick.com', 'support@qwick.com', 'confirmations@qwick.com'],
    available: {
      subjects: ['new shift', 'shift opportunity', 'job posted'],
      keywords: ['apply for this shift', 'click to apply'],
    },
    approved: {
      subjects: ['confirmed for shift', 'you\'re confirmed', 'application accepted'],
      keywords: ['you got the shift', 'confirmed'],
    },
    completed: {
      subjects: ['payment', 'shift complete'],
      keywords: ['payment of', 'you earned'],
    },
  },
  wonolo: {
    senders: ['jobs@wonolo.com', 'confirmations@wonolo.com', 'payments@wonolo.com'],
    available: {
      subjects: ['new wonolo', 'job available', 'request available'],
      keywords: ['request this job', 'apply now'],
    },
    approved: {
      subjects: ['you got the job', 'request approved', 'confirmed'],
      keywords: ['you\'re confirmed', 'approved for'],
    },
    completed: {
      subjects: ['payment sent', 'job complete'],
      keywords: ['payment', 'earned'],
    },
  },
  // Generic patterns for other platforms
  generic: {
    senders: [], // Will match any sender
    available: {
      subjects: ['available', 'new shift', 'new job', 'opportunity', 'open'],
      keywords: ['apply', 'claim', 'available', 'request'],
    },
    approved: {
      subjects: ['confirmed', 'approved', 'accepted', 'you got', 'you\'re in'],
      keywords: ['confirmed', 'approved', 'accepted', 'congratulations'],
    },
    completed: {
      subjects: ['complete', 'finished', 'payment', 'earnings', 'paid'],
      keywords: ['payment', 'earned', 'paid', 'complete', 'finished'],
    },
  },
};

/**
 * Determine which platform sent this email based on sender
 */
function detectPlatform(sender: string): keyof typeof GIG_PLATFORM_PATTERNS | null {
  const senderLower = sender.toLowerCase();
  
  for (const [platform, config] of Object.entries(GIG_PLATFORM_PATTERNS)) {
    if (platform === 'generic') continue;
    if (config.senders.some(s => senderLower.includes(s.toLowerCase()))) {
      return platform as keyof typeof GIG_PLATFORM_PATTERNS;
    }
  }
  
  return null;
}

/**
 * Determine gig status from email content with platform-specific patterns
 */
export function detectGigStatus(
  subject: string,
  body: string,
  sender: string
): 'available' | 'selected' | 'completed' | 'expired' {
  const subjectLower = subject.toLowerCase();
  const bodyLower = body.toLowerCase();
  const senderLower = sender.toLowerCase();
  
  // Try platform-specific detection first
  const platform = detectPlatform(sender);
  if (platform && platform !== 'generic') {
    const patterns = GIG_PLATFORM_PATTERNS[platform];
    
    // Check completed first (highest priority)
    if (
      patterns.completed.subjects.some(s => subjectLower.includes(s.toLowerCase())) ||
      patterns.completed.keywords.some(k => bodyLower.includes(k.toLowerCase()))
    ) {
      return 'completed';
    }
    
    // Check approved/selected
    if (
      patterns.approved.subjects.some(s => subjectLower.includes(s.toLowerCase())) ||
      patterns.approved.keywords.some(k => bodyLower.includes(k.toLowerCase()))
    ) {
      return 'selected';
    }
    
    // Check available
    if (
      patterns.available.subjects.some(s => subjectLower.includes(s.toLowerCase())) ||
      patterns.available.keywords.some(k => bodyLower.includes(k.toLowerCase()))
    ) {
      return 'available';
    }
  }

  // Check for expired/canceled first
  if (
    subjectLower.includes('canceled') ||
    subjectLower.includes('cancelled') ||
    subjectLower.includes('expired') ||
    bodyLower.includes('no longer available') ||
    bodyLower.includes('has been canceled')
  ) {
    return 'expired';
  }

  // Check for completed/payment
  if (
    subjectLower.includes('payment') ||
    subjectLower.includes('paid') ||
    subjectLower.includes('complete') ||
    subjectLower.includes('earnings') ||
    bodyLower.includes('payment of $') ||
    bodyLower.includes('you earned')
  ) {
    return 'completed';
  }

  // Check for approved/confirmed
  if (
    subjectLower.includes('confirmed') ||
    subjectLower.includes('approved') ||
    subjectLower.includes('you got') ||
    subjectLower.includes('you\'re booked') ||
    bodyLower.includes('you\'ve been approved') ||
    bodyLower.includes('confirmed for shift') ||
    bodyLower.includes('congratulations')
  ) {
    return 'selected';
  }

  // Check for available jobs
  if (
    subjectLower.includes('available') ||
    subjectLower.includes('new shift') ||
    subjectLower.includes('new job') ||
    subjectLower.includes('opportunity') ||
    bodyLower.includes('apply now') ||
    bodyLower.includes('claim this')
  ) {
    return 'available';
  }

  // Default to available if unclear
  return 'available';
}

/**
 * Extract job details from email body using regex patterns
 */
export function extractJobDetails(body: string): Partial<InsertGig> {
  const details: Partial<InsertGig> = {};

  // Extract pay/earnings
  const payMatch = body.match(/\$(\d+(?:\.\d{2})?)/);
  if (payMatch) {
    details.payBase = payMatch[1];
  }

  // Extract tip/gratuity
  const tipMatch = body.match(/tip[s]?:?\s*\$?(\d+(?:\.\d{2})?)/i);
  if (tipMatch) {
    details.tipExpected = tipMatch[1];
  }

  // Extract duration (hours or minutes)
  const durationHoursMatch = body.match(/(\d+(?:\.\d+)?)\s*hour[s]?/i);
  const durationMinsMatch = body.match(/(\d+)\s*min(?:ute)?[s]?/i);
  
  if (durationHoursMatch) {
    details.estimatedDuration = Math.round(parseFloat(durationHoursMatch[1]) * 60);
  } else if (durationMinsMatch) {
    details.estimatedDuration = parseInt(durationMinsMatch[1]);
  }

  // Extract location (basic pattern)
  const locationMatch = body.match(/(?:location|address):?\s*([^\n]+)/i);
  if (locationMatch) {
    details.location = locationMatch[1].trim();
  }

  // Extract date/time (basic ISO format)
  const dateMatch = body.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
  if (dateMatch) {
    details.dueDate = new Date(dateMatch[1]);
  }

  return details;
}

/**
 * Parse email content and extract gig data
 */
export interface ParsedEmail {
  messageId: string;
  subject: string;
  from: string;
  date: Date;
  body: string;
  status: 'available' | 'selected' | 'completed' | 'expired';
  extractedDetails: Partial<InsertGig>;
}

export function parseGigEmail(
  messageId: string,
  subject: string,
  body: string,
  from: string,
  date: Date
): ParsedEmail {
  const status = detectGigStatus(subject, body, from);
  const extractedDetails = extractJobDetails(body);

  return {
    messageId,
    subject,
    from,
    date,
    body,
    status,
    extractedDetails,
  };
}

/**
 * Gmail API client setup
 */
export class GmailClient {
  private oauth2Client: any;
  private gmail: any;

  constructor(clientId: string, clientSecret: string, refreshToken: string) {
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost' // Redirect URI (not used for refresh token flow)
    );

    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Fetch emails matching query
   */
  async fetchEmails(query: string, maxResults: number = 50): Promise<any[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
      });

      return response.data.messages || [];
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw new Error('Failed to fetch emails from Gmail');
    }
  }

  /**
   * Get full email content by ID
   */
  async getEmail(messageId: string): Promise<any> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      return response.data;
    } catch (error) {
      console.error('Error getting email:', error);
      throw new Error('Failed to get email content');
    }
  }

  /**
   * Extract email body from Gmail message
   */
  extractBody(payload: any): string {
    let body = '';

    if (payload.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
          if (part.body?.data) {
            body += Buffer.from(part.body.data, 'base64').toString('utf-8');
          }
        }
        if (part.parts) {
          body += this.extractBody(part);
        }
      }
    }

    // Strip HTML tags (basic)
    body = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    return body;
  }

  /**
   * Extract header value from email
   */
  getHeader(headers: any[], name: string): string {
    const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
    return header?.value || '';
  }

  /**
   * Search for gig platform emails and parse them
   */
  async searchGigEmails(
    platforms: string[] = ['gigspot', 'qwick', 'wonolo'],
    afterDate?: Date
  ): Promise<ParsedEmail[]> {
    const parsedEmails: ParsedEmail[] = [];

    // Build query for multiple platforms
    const senderQueries: string[] = [];
    
    for (const platform of platforms) {
      const config = GIG_PLATFORM_PATTERNS[platform as keyof typeof GIG_PLATFORM_PATTERNS];
      if (config && config.senders.length > 0) {
        for (const sender of config.senders) {
          senderQueries.push(`from:${sender}`);
        }
      }
    }

    let query = senderQueries.length > 0 
      ? `(${senderQueries.join(' OR ')})` 
      : 'subject:(gig OR shift OR job OR work)';

    if (afterDate) {
      const dateStr = afterDate.toISOString().split('T')[0].replace(/-/g, '/');
      query += ` after:${dateStr}`;
    }

    const messages = await this.fetchEmails(query, 100);

    for (const message of messages) {
      try {
        const email = await this.getEmail(message.id);
        const headers = email.payload.headers;

        const subject = this.getHeader(headers, 'Subject');
        const from = this.getHeader(headers, 'From');
        const dateStr = this.getHeader(headers, 'Date');
        const body = this.extractBody(email.payload);

        const parsed = parseGigEmail(
          message.id, // Pass Gmail messageId for deduplication
          subject,
          body,
          from,
          new Date(dateStr)
        );

        parsedEmails.push(parsed);
      } catch (error) {
        console.error(`Error parsing email ${message.id}:`, error);
      }
    }

    return parsedEmails;
  }
}

/**
 * Outlook/Microsoft Graph API client (stub for future implementation)
 */
export class OutlookClient {
  constructor(accessToken: string) {
    // TODO: Implement Outlook/Microsoft Graph API integration
    throw new Error('Outlook integration not yet implemented');
  }

  async searchGigEmails(): Promise<ParsedEmail[]> {
    throw new Error('Outlook integration not yet implemented');
  }
}
