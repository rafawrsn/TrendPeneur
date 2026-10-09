import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { Card } from '@/src/components/ui/Card';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DOC_CONTENT: Record<string, { title: string; body: string[] }> = {
  privasi: {
    title: 'Kebijakan Privasi',
    body: [
      'TrendPreneur menghargai privasi kamu. Dokumen ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi kamu.',
      '1. Data yang dikumpulkan: nama, email, modal usaha, konteks usaha, riwayat pembayaran, riwayat analisis, dan notifikasi.',
      '2. Penggunaan data: untuk memberikan layanan analisis tren produk, memproses pembayaran, dan meningkatkan kualitas layanan.',
      '3. Data tren produk dikumpulkan dari sumber publik (Google Trends, marketplace, media sosial, berita) dan tidak terkait dengan data pribadi kamu.',
      '4. Kami tidak membagikan data pribadi kamu kepada pihak ketiga tanpa persetujuan, kecuali untuk keperluan pemrosesan pembayaran.',
      '5. Bukti pembayaran disimpan dengan aman dan hanya dapat diakses oleh tim verifikasi kami.',
      '6. Kamu dapat menghapus akun kapan saja, yang akan menghapus semua data terkait.',
      'Catatan: Dokumen ini adalah draft dan perlu ditinjau oleh tim hukum sebelum digunakan dalam produksi.',
    ],
  },
  syarat: {
    title: 'Syarat & Ketentuan',
    body: [
      'Dengan menggunakan TrendPreneur, kamu menyetujui syarat dan ketentuan berikut:',
      '1. TrendPreneur adalah aplikasi yang menyediakan analisis tren produk usaha berbasis data dan AI.',
      '2. Hasil analisis adalah estimasi berbasis data historis dan tidak menjamin hasil usaha di masa depan.',
      '3. Pembayaran Premium diverifikasi manual oleh tim kami dengan estimasi proses 1x24 jam kerja.',
      '4. Pembayaran yang sudah dilakukan tidak dapat dikembalikan, kecuali dalam kasus khusus yang akan ditinjau tim kami.',
      '5. Kuota analisis harian adalah 5 analisis untuk pengguna Premium (jumlah dapat berubah).',
      '6. Penyalahgunaan layanan, termasuk upaya manipulasi data atau pembayaran, dapat mengakibatkan penonaktifan akun.',
      '7. Kami berhak mengubah syarat dan ketentuan ini sewaktu-waktu dengan pemberitahuan sebelumnya.',
      'Catatan: Dokumen ini adalah draft dan perlu ditinjau oleh tim hukum sebelum digunakan dalam produksi.',
    ],
  },
  disclaimer: {
    title: 'Disclaimer Prediksi',
    body: [
      'Penting untuk dipahami:',
      '1. Semua analisis dan prediksi yang dihasilkan oleh TrendPreneur AI Analyst adalah estimasi berbasis data tren historis.',
      '2. Prediksi TIDAK menjamin hasil usaha, keuntungan, atau kesuksesan di masa depan.',
      '3. Banyak faktor di luar data tren dapat memengaruhi hasil usaha, termasuk eksekusi, kompetisi, regulasi, dan kondisi pasar.',
      '4. Analisis harus digunakan sebagai salah satu bahan pertimbangan, bukan satu-satunya dasar pengambilan keputusan.',
      '5. TrendPreneur tidak bertanggung jawab atas kerugian yang timbul dari keputusan usaha berdasarkan analisis ini.',
      '6. Pastikan kamu melakukan riset mandiri dan berkonsultasi dengan ahli sebelum memulai usaha.',
    ],
  },
};

export default function LegalScreen() {
  const router = useRouter();
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const insets = useSafeAreaInsets();

  const content = DOC_CONTENT[doc ?? 'privasi'] ?? DOC_CONTENT.privasi;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Kembali" accessibilityRole="button">
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>{content.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          {content.body.map((paragraph, i) => (
            <Text key={i} style={styles.paragraph}>{paragraph}</Text>
          ))}
        </Card>
        <Text style={styles.draftNote}>Draft - perlu ditinjau oleh tim hukum</Text>
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
    flex: 1,
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  paragraph: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  draftNote: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textSubtle,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});
