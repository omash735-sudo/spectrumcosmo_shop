// app/api/admin/subscribers/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { format } from 'date-fns';

// For PDF
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

// For Excel
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { format: exportFormat, filters, sortBy, sortOrder, subscriberIds } = await req.json();
    const sql = getDb();

    // Get subscribers data
    const subscribers = await sql`
      SELECT 
        id, email, name, status, 
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        TO_CHAR(confirmed_at, 'YYYY-MM-DD HH24:MI:SS') as confirmed_at,
        TO_CHAR(unsubscribed_at, 'YYYY-MM-DD HH24:MI:SS') as unsubscribed_at,
        preferences
      FROM subscribers
      WHERE id = ANY(${subscriberIds})
      ORDER BY created_at DESC
    `;

    const data = subscribers.map((s: any) => ({
      'Email': s.email,
      'Name': s.name || '-',
      'Status': s.status,
      'Subscribed Date': s.created_at,
      'Confirmed Date': s.confirmed_at || '-',
      'Unsubscribed Date': s.unsubscribed_at || '-',
      'Preferences': s.preferences ? JSON.stringify(s.preferences) : 'None',
    }));

    // Handle different formats
    if (exportFormat === 'pdf') {
      const pdfDoc = createPDF(data);
      const pdfBuffer = await pdf(pdfDoc).toBuffer();
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=subscribers_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        },
      });
    }

    if (exportFormat === 'excel') {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Subscribers');
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename=subscribers_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
        },
      });
    }

    // CSV
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

// PDF generator
function createPDF(data: any[]) {
  const styles = StyleSheet.create({
    page: { padding: 30, backgroundColor: '#ffffff' },
    header: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#F97316' },
    table: { display: 'flex', flexDirection: 'column', borderWidth: 1, borderColor: '#e5e7eb' },
    row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb' },
    headerCell: { 
      padding: 8, 
      backgroundColor: '#f3f4f6', 
      fontWeight: 'bold', 
      fontSize: 10,
      flex: 1,
    },
    cell: { 
      padding: 8, 
      fontSize: 9,
      flex: 1,
    },
    footer: { marginTop: 20, fontSize: 10, color: '#6b7280', textAlign: 'center' },
  });

  const columns = Object.keys(data[0] || {});

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Subscribers Export</Text>
        <Text style={{ fontSize: 12, marginBottom: 10, color: '#6b7280' }}>
          Total: {data.length} subscribers
        </Text>

        <View style={styles.table}>
          <View style={styles.row}>
            {columns.map(col => (
              <View key={col} style={styles.headerCell}>
                <Text>{col}</Text>
              </View>
            ))}
          </View>

          {data.map((row, i) => (
            <View key={i} style={styles.row}>
              {columns.map(col => (
                <View key={col} style={styles.cell}>
                  <Text>{String(row[col] || '-')}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Generated on {format(new Date(), 'MMMM d, yyyy h:mm a')}
        </Text>
      </Page>
    </Document>
  );
}
