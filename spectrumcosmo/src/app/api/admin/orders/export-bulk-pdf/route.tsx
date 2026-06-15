// app/api/admin/orders/export-bulk-pdf/route.tsx
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { renderToStream } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#F97316' },
  subtitle: { fontSize: 10, color: '#6B7280', marginTop: 4 },
  summaryBox: { backgroundColor: '#F3F4F6', padding: 10, marginBottom: 15, borderRadius: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1F2937', padding: 6, marginTop: 10, borderRadius: 4 },
  tableHeaderText: { color: 'white', fontWeight: 'bold', fontSize: 8 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', padding: 6 },
  colId: { width: '15%' },
  colCustomer: { width: '25%' },
  colItems: { width: '25%' },               // added missing style
  colTotal: { width: '15%', textAlign: 'right' },
  colStatus: { width: '10%' },
  colDate: { width: '10%', textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
});

const BulkOrdersPDF = ({ orders }: { orders: any[] }) => {
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Spectrum Cosmo</Text>
          <Text style={styles.subtitle}>Orders Summary Report</Text>
          <Text>Generated: {new Date().toLocaleString()}</Text>
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}><Text>Total Orders:</Text><Text>{orders.length}</Text></View>
          <View style={styles.summaryRow}><Text>Total Revenue:</Text><Text style={{ fontWeight: 'bold' }}>MWK {totalRevenue.toLocaleString()}</Text></View>
          <View style={styles.summaryRow}><Text>Average Order Value:</Text><Text>MWK {avgOrderValue.toLocaleString()}</Text></View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colId]}>Order ID</Text>
          <Text style={[styles.tableHeaderText, styles.colCustomer]}>Customer</Text>
          <Text style={[styles.tableHeaderText, styles.colItems]}>Items</Text>
          <Text style={[styles.tableHeaderText, styles.colTotal]}>Amount</Text>
          <Text style={[styles.tableHeaderText, styles.colStatus]}>Status</Text>
          <Text style={[styles.tableHeaderText, styles.colDate]}>Date</Text>
        </View>

        {orders.map((order, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={styles.colId}>{order.id.slice(-8)}</Text>
            <Text style={styles.colCustomer}>{order.customer_name}</Text>
            <Text style={styles.colItems}>
              {order.items?.map((i: any) => i.product_name).join(', ') || '-'}
            </Text>
            <Text style={styles.colTotal}>MWK {order.total_amount?.toLocaleString()}</Text>
            <Text style={styles.colStatus}>{order.status}</Text>
            <Text style={styles.colDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>Spectrum Cosmo – Confidential Report</Text>
          <Text>This report is for internal use only.</Text>
        </View>
      </Page>
    </Document>
  );
};

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { orders } = await req.json();

    const pdfStream = await renderToStream(<BulkOrdersPDF orders={orders} />);
    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream as any) {
      chunks.push(Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=orders_summary_${new Date().toISOString().slice(0, 19)}.pdf`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
