// app/api/admin/orders/export-bulk-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { renderToStream } from '@react-pdf/renderer';

const COLORS = {
  primary: '#F97316',
  secondary: '#1F2937',
  text: '#374151',
  textLight: '#6B7280',
  border: '#E5E7EB',
  background: '#F9FAFB',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 15,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  logoAccent: {
    color: COLORS.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  summaryBox: {
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
    padding: 8,
    borderRadius: 4,
    marginTop: 10,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    padding: 6,
  },
  colId: { width: '12%' },
  colCustomer: { width: '20%' },
  colItems: { width: '25%' },
  colAmount: { width: '13%', textAlign: 'right' },
  colStatus: { width: '15%' },
  colDate: { width: '15%' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: COLORS.textLight,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
});

const BulkOrdersPDF = ({ orders }: { orders: any[] }) => {
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>
            SPECTRUM <Text style={styles.logoAccent}>COSMO</Text>
          </Text>
          <Text style={styles.title}>Orders Summary Report</Text>
          <Text style={{ fontSize: 8, color: COLORS.textLight, marginTop: 5 }}>
            Generated: {new Date().toLocaleString()}
          </Text>
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={{ fontWeight: 'bold' }}>Total Orders:</Text>
            <Text>{orders.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ fontWeight: 'bold' }}>Total Revenue:</Text>
            <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>MWK {totalRevenue.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ fontWeight: 'bold' }}>Average Order Value:</Text>
            <Text>MWK {avgOrderValue.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colId]}>Order ID</Text>
          <Text style={[styles.tableHeaderText, styles.colCustomer]}>Customer</Text>
          <Text style={[styles.tableHeaderText, styles.colItems]}>Items</Text>
          <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
          <Text style={[styles.tableHeaderText, styles.colStatus]}>Status</Text>
          <Text style={[styles.tableHeaderText, styles.colDate]}>Date</Text>
        </View>

        {orders.map((order, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={styles.colId}>{order.id.slice(-8)}</Text>
            <Text style={styles.colCustomer} numberOfLines={1}>{order.customer_name}</Text>
            <Text style={styles.colItems} numberOfLines={1}>
              {order.items?.map((i: any) => i.product_name).join(', ') || '-'}
            </Text>
            <Text style={[styles.colAmount, { fontWeight: 'bold' }]}>MWK {order.total_amount?.toLocaleString()}</Text>
            <Text style={styles.colStatus}>{order.status}</Text>
            <Text style={styles.colDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>Spectrum Cosmo - Confidential Order Report</Text>
          <Text>For internal use only</Text>
        </View>
      </Page>
    </Document>
  );
};

export async function POST(req: NextRequest) {
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
        'Content-Disposition': `attachment; filename=bulk_orders_${new Date().toISOString().slice(0, 19)}.pdf`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
