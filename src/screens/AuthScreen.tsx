import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { useBookingStore } from '../store/useBookingStore';
import { supabase } from '../lib/supabase';
import { theme } from '../utils/theme';

WebBrowser.maybeCompleteAuthSession();

const POPULAR_FACULTIES = [
  'Khoa Công Nghệ Thông Tin',
  'Khoa Kỹ Thuật Phần Mềm & AI',
  'Khoa Điện - Điện Tử',
  'Khoa Khoa Học Máy Tính',
  'Khoa Quản Trị Kinh Doanh',
];

export const AuthScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const loginWithEmail = useBookingStore((state) => state.loginWithEmail);
  const registerWithEmail = useBookingStore((state) => state.registerWithEmail);
  const loginWithGoogle = useBookingStore((state) => state.loginWithGoogle);
  const continueAsGuest = useBookingStore((state) => state.continueAsGuest);

  const initialMode = route.params?.mode === 'register' ? 'register' : 'login';
  const [authMode, setAuthMode] = useState<'login' | 'register'>(initialMode);

  // Form states - Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form states - Register
  const [regName, setRegName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regFaculty, setRegFaculty] = useState(POPULAR_FACULTIES[0]);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Status & Modals
  const [loading, setLoading] = useState(false);
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Handle OAuth callback on Web if redirected
  React.useEffect(() => {
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
  }, []);

  const handleGooglePress = async () => {
    try {
      setLoading(true);

      // On Web: redirect directly in the same tab for smooth authentication
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
          // Extract tokens from the redirect URL
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

  const handleLoginSubmit = async () => {
    if (!loginEmail.trim()) {
      Alert.alert('Chưa nhập Email / MSSV', 'Vui lòng điền địa chỉ email hoặc mã số sinh viên.');
      return;
    }
    if (!loginPassword.trim()) {
      Alert.alert('Chưa nhập Mật khẩu', 'Vui lòng nhập mật khẩu tài khoản.');
      return;
    }

    setLoading(true);
    const result = await loginWithEmail(loginEmail, loginPassword);
    setLoading(false);

    if (result.success) {
      navigation.replace('MainTabs');
    } else {
      Alert.alert('Đăng nhập thất bại', result.error || 'Vui lòng kiểm tra lại thông tin.');
    }
  };

  const handleRegisterSubmit = async () => {
    if (!regName.trim() || !regStudentId.trim() || !regEmail.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền Họ tên, MSSV và Email.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      Alert.alert('Mật khẩu yếu', 'Mật khẩu cần có độ dài từ 6 ký tự trở lên.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      Alert.alert('Mật khẩu không khớp', 'Mật khẩu xác nhận không trùng khớp với mật khẩu đã nhập.');
      return;
    }
    if (!agreeTerms) {
      Alert.alert('Điều khoản', 'Vui lòng đồng ý với Nội quy phòng học để tiếp tục.');
      return;
    }

    setLoading(true);
    const result = await registerWithEmail({
      name: regName,
      studentId: regStudentId,
      email: regEmail,
      faculty: regFaculty,
      password: regPassword,
    });
    setLoading(false);

    if (result.success) {
      Alert.alert('Đăng ký thành công! 🎉', 'Chào mừng bạn đến với Campus Space!', [
        { text: 'Bắt đầu', onPress: () => navigation.replace('MainTabs') },
      ]);
    } else {
      Alert.alert('Lỗi đăng ký', result.error || 'Đã có lỗi xảy ra.');
    }
  };

  const handleGuestContinue = () => {
    continueAsGuest();
    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar: Brand & Skip Button */}
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <View style={styles.brandIconCircle}>
                <Ionicons name="school" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.brandTitle}>Campus Space</Text>
            </View>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleGuestContinue}
              activeOpacity={0.7}
            >
              <Text style={styles.skipBtnText}>Khách</Text>
              <Ionicons name="arrow-forward" size={14} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Hero Welcome Banner */}
          <View style={styles.heroBox}>
            <Text style={styles.heroSubtitle}>CỔNG ĐĂNG NHẬP SINH VIÊN</Text>
            <Text style={styles.heroTitle}>
              {authMode === 'login'
                ? 'Chào mừng bạn trở lại! 👋'
                : 'Tạo tài khoản sinh viên mới 🎓'}
            </Text>
            <Text style={styles.heroDesc}>
              {authMode === 'login'
                ? 'Đăng nhập để đặt phòng tự học, phòng lab và nhận thông báo nhắc giờ học tức thì.'
                : 'Đăng ký nhanh bằng mã số sinh viên để đặt chỗ nghiên cứu và phòng máy tính.'}
            </Text>
          </View>

          {/* Google Sign-In Button */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGooglePress}
            activeOpacity={0.85}
          >
            <View style={styles.googleLogoContainer}>
              <Ionicons name="logo-google" size={18} color="#EA4335" />
            </View>
            <Text style={styles.googleBtnText}>Tiếp tục với Google</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>hoặc tài khoản sinh viên</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Tab Selector: Đăng Nhập / Đăng Ký */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, authMode === 'login' && styles.tabBtnActive]}
              onPress={() => setAuthMode('login')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="log-in-outline"
                size={16}
                color={authMode === 'login' ? theme.colors.primary : theme.colors.textMuted}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  authMode === 'login' && styles.tabBtnTextActive,
                ]}
              >
                Đăng Nhập
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, authMode === 'register' && styles.tabBtnActive]}
              onPress={() => setAuthMode('register')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person-add-outline"
                size={16}
                color={authMode === 'register' ? theme.colors.primary : theme.colors.textMuted}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  authMode === 'register' && styles.tabBtnTextActive,
                ]}
              >
                Đăng Ký
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Content: LOGIN */}
          {authMode === 'login' && (
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL HOẶC MÃ SỐ SINH VIÊN (MSSV)</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color={theme.colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="ví dụ: hoanglean61@gmail.com hoặc 22IT-108"
                    placeholderTextColor={theme.colors.textMuted}
                    value={loginEmail}
                    onChangeText={setLoginEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>MẬT KHẨU</Text>
                  <TouchableOpacity
                    onPress={() => setForgotModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotLink}>Quên mật khẩu?</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color={theme.colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    placeholderTextColor={theme.colors.textMuted}
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    secureTextEntry={!showLoginPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowLoginPassword(!showLoginPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showLoginPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={theme.colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember Me Option */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkboxBox, rememberMe && styles.checkboxBoxActive]}>
                  {rememberMe && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxLabel}>Ghi nhớ đăng nhập trên thiết bị này</Text>
              </TouchableOpacity>

              {/* Submit CTA Button */}
              <TouchableOpacity
                style={[styles.primarySubmitBtn, loading && { opacity: 0.7 }]}
                onPress={handleLoginSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primarySubmitText}>Đăng Nhập Vào Hệ Thống</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Form Content: REGISTER */}
          {authMode === 'register' && (
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>HỌ VÀ TÊN SINH VIÊN *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color={theme.colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="ví dụ: Lê An Hoàng"
                    placeholderTextColor={theme.colors.textMuted}
                    value={regName}
                    onChangeText={setRegName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>MÃ SỐ SINH VIÊN (MSSV) *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="card-outline" size={18} color={theme.colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="ví dụ: 22IT-108 hoặc B22DCCN001"
                    placeholderTextColor={theme.colors.textMuted}
                    value={regStudentId}
                    onChangeText={setRegStudentId}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>KHOA / VIỆN ĐÀO TẠO</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.facultyChipsScroll}
                >
                  {POPULAR_FACULTIES.map((fac) => {
                    const isSelected = regFaculty === fac;
                    return (
                      <TouchableOpacity
                        key={fac}
                        style={[
                          styles.facultyChip,
                          isSelected && styles.facultyChipSelected,
                        ]}
                        onPress={() => setRegFaculty(fac)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.facultyChipText,
                            isSelected && styles.facultyChipTextSelected,
                          ]}
                        >
                          {fac}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ĐỊA CHỈ EMAIL *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color={theme.colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="email trường hoặc email cá nhân"
                    placeholderTextColor={theme.colors.textMuted}
                    value={regEmail}
                    onChangeText={setRegEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>MẬT KHẨU *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color={theme.colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Tối thiểu 6 ký tự"
                    placeholderTextColor={theme.colors.textMuted}
                    value={regPassword}
                    onChangeText={setRegPassword}
                    secureTextEntry={!showRegPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowRegPassword(!showRegPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showRegPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={theme.colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>XÁC NHẬN MẬT KHẨU *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập lại mật khẩu"
                    placeholderTextColor={theme.colors.textMuted}
                    value={regConfirmPassword}
                    onChangeText={setRegConfirmPassword}
                    secureTextEntry={!showRegPassword}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Terms Checkbox */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAgreeTerms(!agreeTerms)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkboxBox, agreeTerms && styles.checkboxBoxActive]}>
                  {agreeTerms && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  Tôi đồng ý với <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Nội quy phòng học</Text> và Điều khoản campus
                </Text>
              </TouchableOpacity>

              {/* Register Submit Button */}
              <TouchableOpacity
                style={[styles.primarySubmitBtn, loading && { opacity: 0.7 }]}
                onPress={handleRegisterSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primarySubmitText}>Đăng Ký Tài Khoản</Text>
                    <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Footer Note */}
          <View style={styles.footerNoteBox}>
            <Ionicons name="shield-checkmark" size={14} color={theme.colors.accentDark} />
            <Text style={styles.footerNoteText}>
              Bảo mật danh tính sinh viên & kết nối trực tiếp cổng dữ liệu phòng học
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.forgotCard}>
            <View style={styles.forgotIconBox}>
              <Ionicons name="key-outline" size={26} color={theme.colors.primary} />
            </View>
            <Text style={styles.forgotTitle}>Khôi Phục Mật Khẩu</Text>
            <Text style={styles.forgotSubtitle}>
              Nhập email tài khoản sinh viên của bạn để nhận mã khôi phục đặt lại mật khẩu.
            </Text>

            {forgotSubmitted ? (
              <View style={styles.forgotSuccessBox}>
                <Ionicons name="checkmark-circle" size={32} color={theme.colors.accentDark} />
                <Text style={styles.forgotSuccessText}>
                  Đã gửi đường dẫn khôi phục tới:
                </Text>
                <Text style={styles.forgotSuccessEmail}>{forgotEmail}</Text>
                <TouchableOpacity
                  style={styles.forgotDoneBtn}
                  onPress={() => {
                    setForgotSubmitted(false);
                    setForgotModalVisible(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.forgotDoneBtnText}>Đã hiểu</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color={theme.colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập email sinh viên..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.forgotActions}>
                  <TouchableOpacity
                    style={styles.forgotCancelBtn}
                    onPress={() => setForgotModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotCancelText}>Hủy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.forgotSubmitBtn}
                    onPress={() => {
                      if (!forgotEmail.trim()) {
                        Alert.alert('Chưa nhập email', 'Vui lòng nhập email tài khoản của bạn.');
                        return;
                      }
                      setForgotSubmitted(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.forgotSubmitText}>Gửi Yêu Cầu</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: '#EDF2F7',
  },
  skipBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  heroBox: {
    marginBottom: 20,
  },
  heroSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 16,
    ...theme.shadows.soft,
  },
  googleLogoContainer: {
    marginRight: 10,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderRadius: theme.borderRadius.md,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: theme.borderRadius.sm,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...theme.shadows.soft,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  tabBtnTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...theme.shadows.medium,
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  forgotLink: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textPrimary,
    height: '100%',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    marginTop: 2,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxBoxActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  primarySubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    gap: 8,
    ...theme.shadows.soft,
  },
  primarySubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 6,
    gap: 6,
  },
  quickFillText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  facultyChipsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  facultyChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  facultyChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  facultyChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  facultyChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footerNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
  },
  footerNoteText: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  forgotCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  forgotIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  forgotTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  forgotSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 16,
  },
  forgotActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    width: '100%',
  },
  forgotCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#EDF2F7',
  },
  forgotCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  forgotSubmitBtn: {
    flex: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
  },
  forgotSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  forgotSuccessBox: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  forgotSuccessText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  forgotSuccessEmail: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 10,
  },
  forgotDoneBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
  },
  forgotDoneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
