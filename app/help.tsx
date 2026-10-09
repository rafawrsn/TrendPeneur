import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, ChevronUp, Mail, MessageCircle } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FAQS = [
  {
    q: 'Apa itu TrendPreneur?',
    a: 'TrendPreneur adalah aplikasi yang membantu kamu menemukan produk usaha yang sedang tren, melihat grafik tren tahunan, dan mendapatkan analisis ketahanan produk 5-10 tahun ke depan sesuai modalmu.',
  },
  {
    q: 'Apakah prediksi pasti akurat?',
    a: 'Tidak. Prediksi adalah estimasi berbasis data tren historis dan AI. Banyak faktor lain memengaruhi hasil usaha. Gunakan analisis sebagai salah satu bahan pertimbangan, bukan jaminan.',
  },
  {
    q: 'Berapa lama verifikasi pembayaran?',
    a: 'Verifikasi pembayaran dilakukan manual oleh tim kami dengan estimasi proses 1x24 jam kerja. Kamu akan mendapat notifikasi saat pembayaran disetujui atau ditolak.',
  },
  {
    q: 'Bagaimana cara membayar Premium?',
    a: 'Pilih paket Premium, lalu kamu akan melihat kode QRIS dan nominal dengan kode unik. Bayar tepat sesuai nominal, unggah bukti pembayaran, dan tunggu verifikasi.',
  },
  {
    q: 'Berapa kuota analisis AI per hari?',
    a: 'Pengguna Premium mendapat 5 analisis per hari. Kuota direset setiap hari. Analisis yang gagal tidak mengurangi kuota.',
  },
  {
    q: 'Apakah data saya aman?',
    a: 'Data pribadi disimpan dengan aman dan tidak dibagikan ke pihak ketiga tanpa persetujuan. Bukti pembayaran hanya dapat diakses oleh tim verifikasi. Lihat Kebijakan Privasi untuk detail.',
  },
  {
    q: 'Bisa mencari produk tanpa login?',
    a: 'Ya! Sebagai tamu, kamu bisa mencari produk dan melihat grafik tren tanpa login. Login diperlukan untuk menggunakan AI Analyst dan menyimpan preferensi modal.',
  },
  {
    q: 'Bagaimana jika Premium saya berakhir?',
    a: 'Riwayat analisis tetap bisa dibaca, tapi kamu tidak bisa membuat analisis baru. Perpanjang Premium kapan saja untuk melanjutkan menggunakan AI Analyst.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Kembali" accessibilityRole="button">
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Bantuan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>FAQ</Text>
        {FAQS.map((faq, i) => (
          <Card key={i} style={styles.faqCard}>
            <Pressable
              style={styles.faqHeader}
              onPress={() => setExpanded(expanded === i ? null : i)}
              accessibilityLabel={faq.q}
              accessibilityRole="button"
            >
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              {expanded === i ? (
                <ChevronUp size={18} color={colors.textMuted} strokeWidth={2} />
              ) : (
                <ChevronDown size={18} color={colors.textMuted} strokeWidth={2} />
              )}
            </Pressable>
            {expanded === i && (
              <Text style={styles.faqAnswer}>{faq.a}</Text>
            )}
          </Card>
        ))}

        <Text style={styles.sectionTitle}>Hubungi Kami</Text>
        <View style={styles.contactButtons}>
          <Button
            label="Email"
            onPress={() => Linking.openURL('mailto:support@trendpreneur.id')}
            variant="secondary"
            fullWidth
            icon={<Mail size={18} color={colors.primary} strokeWidth={2} />}
          />
          <View style={{ height: spacing.sm }} />
          <Button
            label="WhatsApp"
            onPress={() => Linking.openURL('https://wa.me/6281234567890')}
            variant="secondary"
            fullWidth
            icon={<MessageCircle size={18} color={colors.primary} strokeWidth={2} />}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.sizes.h2,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  sectionTitle: {
    fontSize: typography.sizes.h3,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  faqCard: {
    marginBottom: spacing.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  faqQuestion: {
    flex: 1,
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  faqAnswer: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  contactButtons: {
    marginTop: spacing.sm,
  },
});
