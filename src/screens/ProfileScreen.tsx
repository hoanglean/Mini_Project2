import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  StatusBar,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBookingStore } from '../store/useBookingStore';
import { requestNotificationPermissions } from '../utils/notificationHelper';
import { theme } from '../utils/theme';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
];

export const ProfileScreen: React.FC = () => {
  const userSession = useBookingStore((state) => state.userSession);
  const updateUserSession = useBookingStore((state) => state.updateUserSession);
  const activeReservations = useBookingStore((state) => state.activeReservations);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Edit profile modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState(userSession.name || '');
  const [studentIdInput, setStudentIdInput] = useState(userSession.studentId || '');
  const [facultyInput, setFacultyInput] = useState(userSession.faculty || '');
  const [emailInput, setEmailInput] = useState(userSession.email || '');

  // Avatar modal state
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  const handleRemoveAvatar = () => {
    updateUserSession({ avatarUrl: '' });
    setAvatarModalVisible(false);
    Alert.alert('Đã xóa avatar', 'Hồ sơ đã chuyển về biểu tượng chữ cái đầu.');
  };

  const handleSelectPresetAvatar = (url: string) => {
    updateUserSession({ avatarUrl: url });
    setAvatarModalVisible(false);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) {
      Alert.alert('Chưa nhập link', 'Vui lòng nhập đường dẫn hình ảnh (URL).');
      return;
    }
    updateUserSession({ avatarUrl: customUrlInput.trim() });
    setCustomUrlInput('');
    setAvatarModalVisible(false);
  };

  const handlePickFromDevice = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            updateUserSession({ avatarUrl: base64 });
            setAvatarModalVisible(false);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      Alert.alert(
        'Tải ảnh',
        'Vui lòng chọn 1 trong các ảnh có sẵn bên dưới hoặc dán link ảnh tùy chỉnh.'
      );
    }
  };

  const confirmedCount = activeReservations.filter((r) => r.status === 'confirmed').length;
  const checkedInCount = activeReservations.filter((r) => r.status === 'checked-in').length;
  const totalHours = (confirmedCount + checkedInCount) * 2;

  const handleToggleNotifications = async (val: boolean) => {
    setNotificationsEnabled(val);
    if (val) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        Alert.alert(
          'Notifications Enabled',
          'You will receive check-in reminders 15 minutes prior to every scheduled session.'
        );
      }
    }
  };

  const handleOpenEdit = () => {
    setNameInput(userSession.name || '');
    setStudentIdInput(userSession.studentId || '');
    setFacultyInput(userSession.faculty || '');
    setEmailInput(userSession.email || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = () => {
    if (!nameInput.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ và tên sinh viên.');
      return;
    }
    if (!studentIdInput.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mã số sinh viên (MSSV).');
      return;
    }

    updateUserSession({
      name: nameInput.trim(),
      studentId: studentIdInput.trim(),
      faculty: facultyInput.trim() || 'Khoa Công nghệ Thông tin',
      email:
        emailInput.trim() ||
        `${studentIdInput.trim().toLowerCase()}@campus.edu.vn`,
    });

    setEditModalVisible(false);
    Alert.alert('Thành công', 'Thông tin hồ sơ sinh viên đã được cập nhật.');
  };


  const hasConfiguredProfile = Boolean(userSession.name && userSession.studentId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>CAMPUS IDENTITY</Text>
        <Text style={styles.headerTitle}>Student Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Digital Student ID Badge Card */}
        <View style={styles.idCard}>
          <View style={styles.idTopRow}>
            <View style={styles.avatarColumn}>
              <TouchableOpacity
                style={styles.avatarWrapper}
                onPress={() => setAvatarModalVisible(true)}
                activeOpacity={0.85}
              >
                {userSession.avatarUrl ? (
                  <Image
                    source={{ uri: userSession.avatarUrl }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.initialsAvatar}>
                    <Text style={styles.initialsText}>
                      {userSession.name
                        ? userSession.name.charAt(0).toUpperCase()
                        : '🎓'}
                    </Text>
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={11} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.avatarActionBtn}
                onPress={() => setAvatarModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.avatarActionText}>
                  {userSession.avatarUrl ? 'Thay / Xóa' : 'Thêm ảnh'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.idInfo}>
              <Text style={styles.studentName}>
                {hasConfiguredProfile
                  ? userSession.name
                  : 'Chưa có thông tin sinh viên'}
              </Text>
              <Text style={styles.studentIdBadge}>
                {hasConfiguredProfile
                  ? `ID: ${userSession.studentId}`
                  : 'Chưa có mã số sinh viên'}
              </Text>
              <Text style={styles.facultyText}>
                {hasConfiguredProfile
                  ? userSession.faculty
                  : 'Nhập thông tin khi đặt phòng hoặc nhấn nút bên dưới'}
              </Text>
              {hasConfiguredProfile && userSession.email ? (
                <Text style={styles.emailText}>{userSession.email}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={handleOpenEdit}
              activeOpacity={0.8}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.idDivider} />

          <View style={styles.idBottomRow}>
            <View>
              <Text style={styles.idStatusLabel}>TRẠNG THÁI</Text>
              <Text style={styles.idStatusValue}>
                {hasConfiguredProfile ? 'Đang Học Tập' : 'Chưa Cập Nhật'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.idBadgeVerified,
                !hasConfiguredProfile && { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleOpenEdit}
            >
              <Ionicons
                name={hasConfiguredProfile ? 'shield-checkmark' : 'create'}
                size={15}
                color="#FFFFFF"
              />
              <Text style={styles.idBadgeVerifiedText}>
                {hasConfiguredProfile ? 'Đã Xác Thực' : 'Chỉnh Sửa Hồ Sơ'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Study Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{totalHours}h</Text>
            <Text style={styles.statLabel}>Reserved Hours</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: theme.colors.accentDark }]}>
              {checkedInCount}
            </Text>
            <Text style={styles.statLabel}>Completed Passes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: theme.colors.primary }]}>
              {confirmedCount}
            </Text>
            <Text style={styles.statLabel}>Upcoming Slots</Text>
          </View>
        </View>

        {/* Settings & Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>NOTIFICATION PREFERENCES</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={theme.colors.primary}
              />
              <View>
                <Text style={styles.settingTitle}>15-Minute Check-in Alert</Text>
                <Text style={styles.settingSubtitle}>
                  Push reminder prior to booked slot start
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{
                false: theme.colors.disabled,
                true: theme.colors.primary,
              }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Campus Policies */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>CAMPUS BOOKING RULES</Text>

          <View style={styles.policyCard}>
            <View style={styles.policyRow}>
              <Ionicons name="time" size={16} color={theme.colors.primary} />
              <Text style={styles.policyText}>
                <Text style={{ fontWeight: '700' }}>15-Minute Grace Window: </Text>
                Check in using your QR code within 15 minutes of slot start to avoid release.
              </Text>
            </View>

            <View style={styles.policyRow}>
              <Ionicons name="layers" size={16} color={theme.colors.primary} />
              <Text style={styles.policyText}>
                <Text style={{ fontWeight: '700' }}>Quota Limit: </Text>
                Students may hold up to 2 active room reservations concurrently.
              </Text>
            </View>

            <View style={styles.policyRow}>
              <Ionicons
                name="trash-outline"
                size={16}
                color={theme.colors.primary}
              />
              <Text style={styles.policyText}>
                <Text style={{ fontWeight: '700' }}>Clean Desk Policy: </Text>
                Return all furniture and whiteboard markers to initial setup upon departure.
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBadge}>
                <Ionicons
                  name="person-circle"
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Cập Nhật Hồ Sơ Sinh Viên</Text>
                <Text style={styles.modalSubtitle}>
                  Thông tin này sẽ được dùng khi bạn đặt phòng và tạo mã QR
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  HỌ VÀ TÊN SINH VIÊN <Text style={{ color: theme.colors.danger }}>*</Text>
                </Text>
                <TextInput
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  MÃ SỐ SINH VIÊN (MSSV) <Text style={{ color: theme.colors.danger }}>*</Text>
                </Text>
                <TextInput
                  value={studentIdInput}
                  onChangeText={setStudentIdInput}
                  placeholder="Ví dụ: 22127001"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>KHOA / CHUYÊN NGÀNH</Text>
                <TextInput
                  value={facultyInput}
                  onChangeText={setFacultyInput}
                  placeholder="Ví dụ: Khoa Công nghệ Thông tin"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL TRƯỜNG</Text>
                <TextInput
                  value={emailInput}
                  onChangeText={setEmailInput}
                  placeholder="Ví dụ: student@campus.edu.vn"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.textInput}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmModalBtn}
                onPress={handleSaveProfile}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.confirmModalBtnText}>Lưu Hồ Sơ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Avatar Selection & Management Modal */}
      <Modal
        visible={avatarModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBadge}>
                <Ionicons name="camera" size={22} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Ảnh Đại Diện Sinh Viên</Text>
                <Text style={styles.modalSubtitle}>
                  Chọn ảnh mẫu, tải ảnh từ máy hoặc xóa ảnh
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAvatarModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
              {/* Option 1: Xóa ảnh đại diện if exists */}
              {userSession.avatarUrl ? (
                <TouchableOpacity
                  style={styles.removeAvatarOption}
                  onPress={handleRemoveAvatar}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.removeAvatarTitle}>Xóa ảnh đại diện</Text>
                    <Text style={styles.removeAvatarSubtitle}>
                      Gỡ bỏ hình ảnh và chỉ hiển thị chữ cái đầu tên của bạn
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : null}

              {/* Option 2: Tải ảnh từ thiết bị */}
              <TouchableOpacity
                style={styles.uploadOptionBtn}
                onPress={handlePickFromDevice}
                activeOpacity={0.8}
              >
                <Ionicons name="cloud-upload-outline" size={22} color={theme.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.uploadOptionTitle}>Tải ảnh từ máy tính / thiết bị</Text>
                  <Text style={styles.uploadOptionSubtitle}>
                    Chọn file ảnh từ bộ nhớ thiết bị của bạn
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 3: Chọn ảnh mẫu có sẵn */}
              <Text style={styles.modalSectionLabel}>BỘ SƯU TẬP ẢNH SINH VIÊN</Text>
              <View style={styles.presetGrid}>
                {PRESET_AVATARS.map((url, index) => {
                  const isSelected = userSession.avatarUrl === url;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.presetItem,
                        isSelected && styles.presetItemSelected,
                      ]}
                      onPress={() => handleSelectPresetAvatar(url)}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: url }} style={styles.presetImage} />
                      {isSelected && (
                        <View style={styles.presetCheckmark}>
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Option 4: Dán đường dẫn ảnh tùy ý */}
              <Text style={[styles.modalSectionLabel, { marginTop: 14 }]}>
                HOẶC DÁN ĐƯỜNG DẪN ẢNH (URL)
              </Text>
              <View style={styles.urlInputRow}>
                <TextInput
                  value={customUrlInput}
                  onChangeText={setCustomUrlInput}
                  placeholder="https://example.com/avatar.jpg"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.textInput, { flex: 1 }]}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.applyUrlBtn}
                  onPress={handleApplyCustomUrl}
                  activeOpacity={0.8}
                >
                  <Text style={styles.applyUrlBtnText}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setAvatarModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 50,
  },
  idCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
    marginBottom: theme.spacing.lg,
  },
  idTopRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  idInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  studentIdBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: 2,
  },
  facultyText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  emailText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  idDivider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginVertical: 14,
  },
  idBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idStatusLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
  },
  idStatusValue: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.accentDark,
    marginTop: 2,
  },
  idBadgeVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    gap: 4,
  },
  idBadgeVerifiedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.soft,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.borderLight,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  settingSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  policyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
    ...theme.shadows.soft,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  policyText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  editProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    padding: theme.spacing.xl,
    ...theme.shadows.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  formScroll: {
    maxHeight: 300,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  cancelModalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelModalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  confirmModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: theme.borderRadius.md,
    gap: 6,
  },
  confirmModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarColumn: {
    alignItems: 'center',
    gap: 4,
  },
  initialsAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primaryDark,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarActionBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  avatarActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  removeAvatarOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dangerLight,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    gap: 10,
    marginBottom: 12,
  },
  removeAvatarTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.danger,
  },
  removeAvatarSubtitle: {
    fontSize: 11,
    color: theme.colors.danger,
    marginTop: 2,
  },
  uploadOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    gap: 12,
    marginBottom: 14,
  },
  uploadOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  uploadOptionSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  presetItem: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.border,
    position: 'relative',
  },
  presetItemSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2.5,
  },
  presetImage: {
    width: '100%',
    height: '100%',
  },
  presetCheckmark: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: theme.colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urlInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  applyUrlBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
  },
  applyUrlBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
