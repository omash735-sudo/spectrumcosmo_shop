// app/api/admin/subscribers/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { format } from 'date-fns';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { format: exportFormat, subscriberIds } = await req.json();
    const sql = getDb();

    // Get subscribers data
    const result = await sql.query(`
      SELECT 
        id, email, name, status, 
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        TO_CHAR(confirmed_at, 'YYYY-MM-DD HH24:MI:SS') as confirmed_at,
        TO_CHAR(unsubscribed_at, 'YYYY-MM-DD HH24:MI:SS') as unsubscribed_at,
        preferences
      FROM subscribers
      WHERE id = ANY($1)
      ORDER BY created_at DESC
    `, [subscriberIds]);

    const subscribers = result.rows;

    const data = subscribers.map((s: any) => ({
      'Email': s.email,
      'Name': s.name || '-',
      'Status': s.status,
      'Subscribed Date': s.created_at,
      'Confirmed Date': s.confirmed_at || '-',
      'Unsubscribed Date': s.unsubscribed_at || '-',
      'Preferences': s.preferences ? JSON.stringify(s.preferences) : 'None',
    }));

    // Handle PDF export using pdf-lib
    if (exportFormat === 'pdf') {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // Letter size
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const { width, height } = page.getSize();
      let y = height - 50;
      
      // Header
      page.drawText('SpectrumCosmo - Subscribers Export', {
        x: 50,
        y,
        size: 18,
        font: fontBold,
        color: rgb(0.976, 0.451, 0.086),
      });
      
      y -= 30;
      page.drawText(`Total: ${data.length} subscribers`, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      
      y -= 10;
      page.drawText(`Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}`, {
        x: 50,
        y,
        size: 10,
        font,
        color: rgb(0.6, 0.6, 0.6),
      });
      
      y -= 30;
      
      // Table headers
      const headers = ['Email', 'Name', 'Status', 'Subscribed', 'Confirmed', 'Unsubscribed'];
      const colWidths = [150, 100, 70, 100, 100, 100];
      let xPos = 50;
      
      // Draw header background
      page.drawRectangle({
        x: 50,
        y: y - 15,
        width: 620,
        height: 20,
        color: rgb(0.95, 0.95, 0.95),
      });
      
      headers.forEach((header, i) => {
        page.drawText(header, {
          x: xPos + 5,
          y: y - 2,
          size: 9,
          font: fontBold,
          color: rgb(0.2, 0.2, 0.2),
        });
        xPos += colWidths[i];
      });
      
      y -= 25;
      
      // Draw data rows (limit to fit on page)
      const maxRows = 40;
      const rowsToShow = data.slice(0, maxRows);
      
      rowsToShow.forEach((row: any) => {
        let xPos2 = 50;
        const rowData = [
          String(row['Email'] || '-'),
          String(row['Name'] || '-'),
          String(row['Status'] || '-'),
          String(row['Subscribed Date'] || '-'),
          String(row['Confirmed Date'] || '-'),
          String(row['Unsubscribed Date'] || '-'),
        ];
        
        rowData.forEach((text, i) => {
          page.drawText(text, {
            x: xPos2 + 5,
            y: y - 2,
            size: 8,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });
          xPos2 += colWidths[i];
        });
        
        y -= 18;
        
        // Add new page if needed
        if (y < 50) {
          // This is simplified - for many rows, you'd add a new page
        }
      });
      
      // Footer
      if (data.length > maxRows) {
        y -= 10;
        page.drawText(`... and ${data.length - maxRows} more subscribers`, {
          x: 50,
          y,
          size: 10,
          font,
          color: rgb(0.6, 0.6, 0.6),
        });
      }
      
      const pdfBytes = await pdfDoc.save();
      
      return new NextResponse(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=subscribers_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        },
      });
    }

    // Handle Excel export
    if (exportFormat === 'excel') {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 30 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 30 },
      ];
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Subscribers');
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename=subscribers_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
        },
      });
    }

    // Handle CSV export
    const headers = Object.keys(data[0] || {});
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ];
    const csvContent = csvRows.join('\n');
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=subscribers_${format(new Date(), 'yyyy-MM-dd')}.csv`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
