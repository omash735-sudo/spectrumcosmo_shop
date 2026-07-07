// app/api/newsletter/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendEmail } from '@/lib/email/send';
import { renderNewsletterEmail } from '@/lib/email/templates';

interface Subscriber {
  id: number;
  email: string;
  name: string;
  preferences: any;
  confirmed_at?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      title, 
      content, 
      image_url, 
      audience = 'all',
      segment = null,
      schedule_for = null,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Get subscribers using tagged template literal
    const subscribers = await sql`
      SELECT id, email, name, preferences, confirmed_at
      FROM subscribers 
      WHERE status = 'confirmed'
    `;

    // Type assertion to tell TypeScript this is an array of Subscriber
    let filteredSubscribers = subscribers as Subscriber[];
    
    // Apply audience filters in JavaScript
    if (audience === 'active') {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      filteredSubscribers = filteredSubscribers.filter((s) => 
        s.confirmed_at && new Date(s.confirmed_at) > ninetyDaysAgo
      );
    } else if (audience === 'segment' && segment) {
      const { topics, frequency } = segment;
      filteredSubscribers = filteredSubscribers.filter((s) => {
        let match = true;
        const prefs = s.preferences || {};
        
        if (topics && topics.length > 0) {
          const subscriberTopics = prefs.topics || [];
          match = match && topics.some((t: string) => subscriberTopics.includes(t));
        }
        
        if (frequency) {
          match = match && prefs.frequency === frequency;
        }
        
        return match;
      });
    }

    if (filteredSubscribers.length === 0) {
      return NextResponse.json(
        { error: 'No subscribers match the selected audience' },
        { status: 400 }
      );
    }

    // Create campaign record
    const [campaign] = await sql`
      INSERT INTO newsletter_campaigns (
        title, 
        content, 
        image_url, 
        audience, 
        status, 
        total_subscribers, 
        created_at
      )
      VALUES (
        ${title}, 
        ${content}, 
        ${image_url || null}, 
        ${audience}, 
        ${schedule_for ? 'scheduled' : 'sending'}, 
        ${filteredSubscribers.length}, 
        NOW()
      )
      RETURNING id
    `;

    const campaignId = campaign.id;

    // If scheduled, just return
    if (schedule_for) {
      return NextResponse.json({
        success: true,
        campaignId,
        message: `Campaign scheduled for ${new Date(schedule_for).toLocaleString()}`,
        totalRecipients: filteredSubscribers.length,
      });
    }

    // Send emails
    const emailPromises = filteredSubscribers.map(async (subscriber: Subscriber) => {
      try {
        const html = renderNewsletterEmail(
          title,
          content,
          image_url,
          campaignId,
          subscriber.id
        ).replace('{{email}}', subscriber.email);

        await sendEmail({
          to: subscriber.email,
          subject: title,
          html,
          trackId: { campaignId, subscriberId: subscriber.id },
        });

        // Track recipient
        await sql`
          INSERT INTO campaign_recipients (campaign_id, subscriber_id, sent_at)
          VALUES (${campaignId}, ${subscriber.id}, NOW())
        `;

        return { success: true, email: subscriber.email };
      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error);
        return { success: false, email: subscriber.email };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    // Update campaign status
    await sql`
      UPDATE newsletter_campaigns
      SET status = 'sent', sent_at = NOW()
      WHERE id = ${campaignId}
    `;

    return NextResponse.json({
      success: true,
      campaignId,
      message: `Newsletter sent to ${successful} subscribers! 📨 (${failed} failed)`,
      totalRecipients: filteredSubscribers.length,
      successful,
      failed,
    });
  } catch (err) {
    console.error('Newsletter send error:', err);
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}
