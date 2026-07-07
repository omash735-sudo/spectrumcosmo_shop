// app/api/newsletter/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryMany } from '@/lib/db';
import { sendBulkEmails } from '@/lib/email/send';
import { renderNewsletterEmail } from '@/lib/email/templates';

interface Subscriber {
  id: number;
  email: string;
  name: string;
  preferences: any;
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

    // Build subscriber query based on audience
    let subscriberQuery = `
      SELECT id, email, name, preferences 
      FROM subscribers 
      WHERE status = 'confirmed'
    `;

    // Apply audience filters
    if (audience === 'active') {
      subscriberQuery += ` AND confirmed_at > NOW() - INTERVAL '90 days'`;
    } else if (audience === 'segment' && segment) {
      // Handle preference-based segment
      const { topics, frequency } = segment;
      if (topics && topics.length > 0) {
        const topicConditions = topics.map((t: string) => 
          `preferences->>'topics' LIKE '%${t}%'`
        ).join(' OR ');
        subscriberQuery += ` AND (${topicConditions})`;
      }
      if (frequency) {
        subscriberQuery += ` AND preferences->>'frequency' = '${frequency}'`;
      }
    }

    // Get subscribers - use sql template literal
    const subscribers = await sql.query(subscriberQuery);

    if (subscribers.rows.length === 0) {
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
        ${subscribers.rows.length}, 
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
        totalRecipients: subscribers.rows.length,
      });
    }

    // Send emails
    const emailPromises = subscribers.rows.map(async (subscriber: Subscriber) => {
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

        return { success: true };
      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error);
        return { success: false };
      }
    });

    await Promise.all(emailPromises);

    // Update campaign status
    await sql`
      UPDATE newsletter_campaigns
      SET status = 'sent', sent_at = NOW()
      WHERE id = ${campaignId}
    `;

    return NextResponse.json({
      success: true,
      campaignId,
      message: `Newsletter sent to ${subscribers.rows.length} subscribers! 📨`,
      totalRecipients: subscribers.rows.length,
    });
  } catch (err) {
    console.error('Newsletter send error:', err);
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}
