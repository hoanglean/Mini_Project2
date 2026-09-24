import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Svg, { Path } from 'react-native-svg';
import { useBookingStore } from '../store/useBookingStore';
import { supabase } from '../lib/supabase';
import { theme } from '../utils/theme';

WebBrowser.maybeCompleteAuthSession();

// Official 4-color Google G Logo in SVG
const GoogleLogo: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <Path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <Path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
    />
    <Path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </Svg>
);

export const AuthScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const loginWithGoogle = useBookingStore((state) => state.loginWithGoogle);
  const continueAsGuest = useBookingStore((state) => state.continueAsGuest);

  const [loading, setLoading] = useState(false);

  // Auto-detect OAuth redirect callback on Web (hash or PKCE code)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;

      if ((hash && hash.includes('access_token')) || (search && search.includes('code='))) {
        setLoading(true);
        supabase.auth.getSession().then(async ({ data: sessionData, error: sessionErr }) => {
          if (!sessionErr && sessionData?.session?.user) {
            const user = sessionData.session.user;
            await loginWithGoogle({
              name: user.user_metadata?.full_name || user.user_metadata?.name || '',
              email: user.email || '',
              studentId: 'GG-' + (user.id?.slice(-5) || ''),
              faculty: 'Khoa Công Nghệ Thông Tin',
            });
            window.history.replaceState(null, '', window.location.pathname);
            navigation.replace('MainTabs');
            setLoading(false);
            return;
          }

          if (hash && hash.includes('access_token')) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            if (accessToken) {
              const { data: manualData, error: manualErr } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });
              if (!manualErr && manualData?.user) {
                await loginWithGoogle({
                  name: manualData.user.user_metadata?.full_name || manualData.user.user_metadata?.name || '',
                  email: manualData.user.email || '',
                  studentId: 'GG-' + (manualData.user.id?.slice(-5) || ''),
                  faculty: 'Khoa Công Nghệ Thông Tin',
                });
                window.history.replaceState(null, '', window.location.pathname);
                navigation.replace('MainTabs');
              }
            }
          }
          setLoading(false);
        });
      }
    }
  }, [loginWithGoogle, navigation]);

  const handleGooglePress = async () => {
    try {
      setLoading(true);

      // On Web: redirect directly in current tab for the smoothest browser UX
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) {
          Alert.alert('Lỗi đăng nhập', error.message);
          setLoading(false);
        }
        return;
      }

      // On Mobile (iOS / Android / Expo Go)
      const redirectTo = makeRedirectUri({ scheme: 'campusbooking', path: 'auth/callback' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        Alert.alert('Lỗi đăng nhập', error.message);
        return;
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success' && result.url) {
          const url = new URL(result.url);
          const params = new URLSearchParams(url.hash?.substring(1) || url.search?.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (sessionError) {
              Alert.alert('Lỗi phiên đăng nhập', sessionError.message);
              return;
            }

            if (sessionData.user) {
              await loginWithGoogle({
                name: sessionData.user.user_metadata?.full_name || sessionData.user.user_metadata?.name || '',
                email: sessionData.user.email || '',
                studentId: 'GG-' + (sessionData.user.id?.slice(-5) || ''),
                faculty: 'Khoa Công Nghệ Thông Tin',
              });
              navigation.replace('MainTabs');
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      Alert.alert('Lỗi đăng nhập', 'Không thể hoàn tất đăng nhập với Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    continueAsGuest();
    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Decorative Background Glows */}
      <View style={styles.bgGlowTop} pointerEvents="none" />
      <View style={styles.bgGlowBottom} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Ionicons name="school" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.logoText}>Campus Space</Text>
              <Text style={styles.logoTagline}>VKU SMART BOOKING</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.guestPill}
            onPress={handleGuestContinue}
            activeOpacity={0.7}
          >
            <Text style={styles.guestPillText}>Khách</Text>
            <Ionicons name="arrow-forward" size={13} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.verifiedTag}>
            <View style={styles.verifiedDot} />
            <Text style={styles.verifiedTagText}>HỆ THỐNG ĐẶT PHÒNG HỌC & LAB</Text>
          </View>

          <Text style={styles.heroTitle}>
            Không gian học tập <Text style={styles.heroTitleHighlight}>thông minh</Text> cho sinh viên
          </Text>

          <Text style={styles.heroSubtitle}>
            Tra cứu phòng trống thời gian thực tại các tòa nhà A, B, C, V. Đặt chỗ tức thì và nhận thông báo nhắc nhở tự động.
          </Text>

          {/* 3 Quick Value Props */}
          <View style={styles.featureGrid}>
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="business" size={18} color="#4F46E5" />
              </View>
              <Text style={styles.featureCardTitle}>4 Tòa Nhà</Text>
              <Text style={styles.featureCardDesc}>Khu A, B, C & Lab V</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="flash" size={18} color="#10B981" />
              </View>
              <Text style={styles.featureCardTitle}>Đặt 30s</Text>
              <Text style={styles.featureCardDesc}>Xác nhận tức thì</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="qr-code" size={18} color="#D97706" />
              </View>
              <Text style={styles.featureCardTitle}>Vé QR Code</Text>
              <Text style={styles.featureCardDesc}>Check-in tại phòng</Text>
            </View>
          </View>
        </View>

        {/* Main Google Login Card */}
        <View style={styles.authCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconRing}>
              <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Đăng Nhập Hệ Thống</Text>
            <Text style={styles.cardSubtitle}>
              Xác thực an toàn bằng tài khoản Google trường (@vku.udn.vn) hoặc cá nhân để lưu dữ liệu đặt phòng lên đám mây.
            </Text>
          </View>

          {/* Google Sign-in Button */}
          <TouchableOpacity
            style={[styles.googleButton, loading && styles.googleButtonDisabled]}
            onPress={handleGooglePress}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Đang kết nối Google...</Text>
              </View>
            ) : (
              <>
                <View style={styles.googleIconBox}>
                  <GoogleLogo size={24} />
                </View>
                <Text style={styles.googleButtonText}>Tiếp tục với Google</Text>
                <Ionicons name="arrow-forward" size={18} color="#64748B" />
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>HOẶC TRẢI NGHIỆM TRƯỚC</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Continue as Guest Button */}
          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuestContinue}
            activeOpacity={0.8}
          >
            <Ionicons name="compass-outline" size={19} color={theme.colors.textSecondary} />
            <Text style={styles.guestButtonText}>Khám phá với tư cách Khách tham quan</Text>
          </TouchableOpacity>

          {/* Trust badges */}
          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <Ionicons name="lock-closed" size={12} color="#10B981" />
              <Text style={styles.trustText}>OAuth 2.0</Text>
            </View>
            <Text style={styles.trustDot}>•</Text>
            <View style={styles.trustItem}>
              <Ionicons name="cloud-done" size={12} color="#10B981" />
              <Text style={styles.trustText}>Supabase Cloud</Text>
            </View>
            <Text style={styles.trustDot}>•</Text>
            <View style={styles.trustItem}>
              <Ionicons name="notifications" size={12} color="#10B981" />
              <Text style={styles.trustText}>Nhắc giờ học</Text>
            </View>
          </View>
        </View>

        {/* Footer info */}
        <View style={styles.footerBox}>
          <Text style={styles.footerText}>
            Hệ thống Quản lý & Đặt phòng Học tập - Phòng Thực hành
          </Text>
          <Text style={styles.footerSub}>
            Trường Đại học Công nghệ Thông tin & Truyền thông Việt - Hàn (VKU)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 12,
    paddingBottom: 32,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },

  // Glow elements
  bgGlowTop: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
  },
  bgGlowBottom: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(16, 185, 129, 0.07)',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  logoTagline: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 0.8,
  },
  guestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  guestPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },

  // Hero Section
  heroSection: {
    marginBottom: 24,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    marginRight: 6,
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 34,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  heroTitleHighlight: {
    color: theme.colors.primary,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 18,
  },

  // Feature Grid
  featureGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  featureCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  featureCardDesc: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
  },

  // Auth Card
  authCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 20,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
  },

  // Google Button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 18,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  googleIconBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 10,
    paddingVertical: 3,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    paddingHorizontal: 12,
    letterSpacing: 0.6,
  },

  // Guest Button
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  guestButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },

  // Trust Badges
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  trustDot: {
    fontSize: 10,
    color: '#CBD5E1',
  },

  // Footer
  footerBox: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 2,
  },
  footerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
});
