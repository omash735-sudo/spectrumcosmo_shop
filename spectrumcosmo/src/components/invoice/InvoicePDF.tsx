// components/invoice/InvoicePDF.tsx
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register a professional font (optional)
Font.register({
  family: 'Open Sans',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/opensans/v18/mem8YaGs126MiZpBA-UFVZ0e.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/opensans/v18/mem5YaGs126MiZpBA-UN7rgOUuhp.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Open Sans', fontSize: 10, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, borderBottom: 1, borderBottomColor: '#F97316', paddingBottom: 20 },
  logo: { width: 120, height: 'auto' },
  invoiceTitle: { fontSize: 24, fontWeight: 'bold', color: '#F97316' },
  infoBox: { marginBottom: 20, padding: 12, backgroundColor: '#f9fafb', borderRadius: 8 },
  infoRow: { flexDirection: 'row', marginBottom: 6 },
  infoLabel: { width: 100, fontSize: 9, fontWeight: 'bold', color: '#4b5563' },
  infoValue: { flex: 1, fontSize: 9, color: '#111827' },
  table: { marginVertical: 20, borderTop: 1, borderBottom: 1, borderColor: '#e5e7eb' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F97316', paddingVertical: 8, paddingHorizontal: 8 },
  tableHeaderCell: { flex: 1, fontSize: 9, fontWeight: 'bold', color: '#ffffff' },
  tableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tableCell: { flex: 1, fontSize: 9, color: '#374151' },
  totals: { marginTop: 20, alignItems: 'flex-end' },
  totalLine: { flexDirection: 'row', marginBottom: 4 },
  totalLabel: { width: 100, fontSize: 10, fontWeight: 'bold' },
  totalAmount: { width: 120, fontSize: 10, fontWeight: 'bold', color: '#F97316', textAlign: 'right' },
  footer: { marginTop: 40, textAlign: 'center', fontSize: 8, color: '#9ca3af', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 20 },
  qrCode: { width: 60, height: 60, marginTop: 10, alignSelf: 'flex-end' },
});

export function InvoicePDF({ data }: any) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src={data.companyLogo} style={styles.logo} />
          <Text style={styles.invoiceTitle}>INVOICE</Text>
        </View>

        {/* Order & Customer Info */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Invoice Number</Text>
            <Text style={styles.infoValue}>{data.invoiceNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order Date</Text>
            <Text style={styles.infoValue}>{data.orderDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Customer</Text>
            <Text style={styles.infoValue}>{data.customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email / Phone</Text>
            <Text style={styles.infoValue}>{data.customerEmail} / {data.customerPhone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Delivery Address</Text>
            <Text style={styles.infoValue}>{data.deliveryAddress}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method</Text>
            <Text style={styles.infoValue}>{data.paymentMethod} – {data.paymentStatus === 'paid' ? 'Paid' : 'Pending'}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderCell}>Item</Text>
            <Text style={styles.tableHeaderCell}>Qty</Text>
            <Text style={styles.tableHeaderCell}>Unit Price</Text>
            <Text style={styles.tableHeaderCell}>Total</Text>
          </View>
          {data.items.map((item: any, idx: number) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.tableCell}>{item.product_name}</Text>
              <Text style={styles.tableCell}>{item.quantity}</Text>
              <Text style={styles.tableCell}>MWK {Number(item.unit_price || item.price).toLocaleString()}</Text>
              <Text style={styles.tableCell}>MWK {(Number(item.quantity) * Number(item.unit_price || item.price)).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalAmount}>MWK {data.subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Delivery Fee</Text>
            <Text style={styles.totalAmount}>MWK {data.deliveryFee.toLocaleString()}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>MWK {data.total.toLocaleString()}</Text>
          </View>
        </View>

        {/* QR Code for tracking */}
        <View style={{ marginTop: 20, alignItems: 'flex-end' }}>
          <Image src={data.qrCodeDataUrl} style={styles.qrCode} />
          <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 4 }}>Track your order</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{data.companyName} | {data.companyAddress}</Text>
          <Text>{data.companyEmail} | {data.companyPhone}</Text>
          <Text>© {new Date().getFullYear()} {data.companyName}. All rights reserved.</Text>
        </View>
      </Page>
    </Document>
  );
}
