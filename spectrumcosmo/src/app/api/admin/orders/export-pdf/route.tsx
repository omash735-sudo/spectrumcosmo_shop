import { NextRequest, NextResponse } from 'next/server';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { renderToStream } from '@react-pdf/renderer';

const COLORS = {
  primary: '#F97316',
  secondary: '#1F2937',
  accent: '#10B981',
  text: '#374151',
  textLight: '#6B7280',
  border: '#E5E7EB',
  background: '#F9FAFB',
};

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 5,
  },
  logoAccent: {
    color: COLORS.primary,
  },
  tagline: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginTop: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 10,
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: 120,
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  value: {
    flex: 1,
    color: COLORS.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  card: {
    width: '48%',
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 8,
    marginRight: '4%',
    marginBottom: 10,
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
    padding: 10,
    borderRadius: 4,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    padding: 10,
  },
  colItem: { width: '45%' },
  colQty: { width: '15%', textAlign: 'center' },
  colPrice: { width: '20%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  totals: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  totalLabel: {
    width: 100,
    textAlign: 'right',
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  totalValue: {
    width: 120,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  grandTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: COLORS.textLight,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 15,
  },
  statusBadge: {
    padding: '4 8',
    borderRadius: 12,
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 80,
  },
  deliveryMethodRow: {
    flexDirection: 'row',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

const OrderInvoicePDF = ({ order }: { order: any }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return { bg: '#D1FAE5', text: '#059669' };
      case 'shipped': return { bg: '#EDE9FE', text: '#7C3AED' };
      case 'processing': return { bg: '#DBEAFE', text: '#2563EB' };
      case 'pending': return { bg: '#FEF3C7', text: '#D97706' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const statusStyle = getStatusColor(order.status);
  const deliveryMethod = order.custom_delivery_method || 'Not specified';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>
            SPECTRUM <Text style={styles.logoAccent}>COSMO</Text>
          </Text>
          <Text style={styles.tagline}>Premium Anime Merchandise</Text>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
        </View>

        {/* Invoice Info Row */}
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Invoice Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Invoice #:</Text>
              <Text style={styles.value}>{order.id.slice(-12).toUpperCase()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Date:</Text>
              <Text style={styles.value}>{new Date(order.created_at).toLocaleDateString()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Due Date:</Text>
              <Text style={styles.value}>{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</Text>
            </View>
          </View>
          <View style={styles.card}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Order Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, alignSelf: 'flex-start' }]}>
              <Text style={{ color: statusStyle.text, textTransform: 'capitalize' }}>{order.status}</Text>
            </View>
            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>Payment:</Text>
              <Text style={[styles.value, { color: order.payment_status === 'paid' ? '#059669' : '#D97706' }]}>
                {order.payment_status === 'paid' ? '✓ Paid' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Name:</Text>
            <Text style={styles.value}>{order.customer_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email Address:</Text>
            <Text style={styles.value}>{order.customer_email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone Number:</Text>
            <Text style={styles.value}>{order.phone_number || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Delivery Address:</Text>
            <Text style={styles.value}>{order.delivery_address || order.location || 'N/A'}</Text>
          </View>
          <View style={styles.deliveryMethodRow}>
            <Text style={styles.label}>Preferred Courier:</Text>
            <Text style={styles.value}>{deliveryMethod}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colItem]}>Item Description</Text>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderText, styles.colPrice]}>Unit Price</Text>
              <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
            </View>
            {(order.items || []).map((item: any, idx: number) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.colItem, { color: COLORS.text }]}>{item.product_name}</Text>
                <Text style={[styles.colQty, { color: COLORS.text, textAlign: 'center' }]}>{item.quantity}</Text>
                <Text style={[styles.colPrice, { color: COLORS.text, textAlign: 'right' }]}>MWK {item.unit_price?.toLocaleString()}</Text>
                <Text style={[styles.colTotal, { color: COLORS.text, textAlign: 'right', fontWeight: 'bold' }]}>MWK {(item.unit_price * item.quantity)?.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>MWK {order.subtotal?.toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Delivery Fee:</Text>
            <Text style={styles.totalValue}>MWK {order.delivery_fee?.toLocaleString() || 0}</Text>
          </View>
          {order.discount_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text style={[styles.totalValue, { color: COLORS.accent }]}>- MWK {order.discount_amount?.toLocaleString()}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { fontSize: 14 }]}>Grand Total:</Text>
              <Text style={[styles.totalValue, { fontSize: 14, color: COLORS.primary }]}>MWK {order.total_amount?.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Thank you for shopping with Spectrum Cosmo!</Text>
          <Text>For inquiries: support@spectrumcosmo.com | +265 893 160 202</Text>
          <Text>This is a computer-generated invoice. No signature required.</Text>
        </View>
      </Page>
    </Document>
  );
};

export async function POST(req: NextRequest) {
  try {
    const { order } = await req.json();

    const pdfStream = await renderToStream(<OrderInvoicePDF order={order} />);
    
    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream as any) {
      chunks.push(Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice_${order.id.slice(-8)}.pdf`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
