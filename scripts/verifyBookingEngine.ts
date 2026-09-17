import './setupEnv';
import { MOCK_ROOMS, getInitialReservations } from '../src/data/mockRooms';
import { useBookingStore } from '../src/store/useBookingStore';
import { getUpcomingDays, isSlotInPast, TIME_SLOTS } from '../src/utils/dateHelper';

async function runVerification() {
  console.log('=== Starting Campus Booking Engine Verification ===\n');

  // 1. Verify Mock Data
  console.log(`[Test 1] Verifying Room Directory...`);
  console.log(`- Loaded ${MOCK_ROOMS.length} rooms`);
  if (MOCK_ROOMS.length < 8) throw new Error('Expected at least 8 rooms');

  const buildings = new Set(MOCK_ROOMS.map((r) => r.building));
  console.log(`- Buildings represented:`, Array.from(buildings).join(', '));
  if (!buildings.has('Building A') || !buildings.has('Building B') || !buildings.has('Building C') || !buildings.has('Building V')) {
    throw new Error('All 4 campus buildings (A, B, C, V) must be represented');
  }

  // Check capacity range
  const capacities = MOCK_ROOMS.map((r) => r.capacity);
  const minCap = Math.min(...capacities);
  const maxCap = Math.max(...capacities);
  console.log(`- Capacity range: ${minCap} to ${maxCap} students`);
  if (minCap > 2 || maxCap < 18) {
    throw new Error('Capacity should range from 2 to 20 students');
  }
  console.log('✓ Mock rooms verified successfully.\n');

  // 2. Verify 7-day calendar and discrete time slots
  console.log(`[Test 2] Verifying Date & Time Slot Calculations...`);
  const days = getUpcomingDays(7);
  console.log(`- Generated ${days.length} upcoming days: ${days[0].dateString} to ${days[6].dateString}`);
  if (days.length !== 7) throw new Error('Expected 7 upcoming days');
  console.log(`- Discrete 2-hour slots:`, TIME_SLOTS);
  if (TIME_SLOTS.length !== 4) throw new Error('Expected 4 discrete 2-hour slots');
  console.log('✓ Date & Time Slot helpers verified successfully.\n');

  // 3. Verify Multi-Parameter Filtering Engine
  console.log(`[Test 3] Verifying Multi-Parameter Filtering Engine...`);
  const store = useBookingStore.getState();

  // Test Building Filter
  store.setFilters({ building: 'Building A' });
  let filtered = store.getFilteredRooms();
  console.log(`- Filter by Building A: found ${filtered.length} rooms`);
  if (filtered.some((r) => r.building !== 'Building A')) {
    throw new Error('Building filter leaked non-Building A rooms');
  }

  // Test Equipment Filter
  store.resetFilters();
  store.setFilters({ equipment: ['High-spec PC'] });
  filtered = store.getFilteredRooms();
  console.log(`- Filter by "High-spec PC": found ${filtered.length} labs`);
  if (filtered.some((r) => !r.equipment.includes('High-spec PC'))) {
    throw new Error('Equipment filter leaked room without High-spec PC');
  }

  // Test Capacity Filter
  store.resetFilters();
  store.setFilters({ minCapacity: 15 });
  filtered = store.getFilteredRooms();
  console.log(`- Filter by minCapacity 15: found ${filtered.length} rooms`);
  if (filtered.some((r) => r.capacity < 15)) {
    throw new Error('Capacity filter leaked room with capacity < 15');
  }

  // Test Keyword Search
  store.resetFilters();
  store.setFilters({ searchQuery: 'Turing' });
  filtered = store.getFilteredRooms();
  console.log(`- Filter by search query "Turing": found ${filtered.length} rooms`);
  if (filtered.length !== 1 || filtered[0].code !== 'A-101') {
    throw new Error('Keyword search failed to accurately match Turing AI Lab');
  }
  store.resetFilters();
  console.log('✓ Multi-parameter filter engine verified successfully.\n');

  // 4. Verify Real-time Slot Conflict Prevention Engine
  console.log(`[Test 4] Verifying Real-time Conflict Engine & Double-Booking Prevention...`);
  const testDate = days[2].dateString; // Day 3 (future date to guarantee slot is not in past)
  const testRoom = 'room-a-101';
  const testSlot = '07:30 - 09:30';

  // Verify initially slot is available
  const isInitiallyBooked = store.isSlotBooked(testRoom, testDate, testSlot);
  console.log(`- Pre-check: isSlotBooked for ${testRoom} on ${testDate} at ${testSlot}: ${isInitiallyBooked}`);
  if (isInitiallyBooked) {
    throw new Error('Slot should be available initially on future date');
  }

  // Book the slot
  console.log(`- Reserving slot: ${testRoom} on ${testDate} at ${testSlot}...`);
  const bookingResult = await store.bookRoom(testRoom, testDate, testSlot);
  if (!bookingResult.success || !bookingResult.reservation) {
    throw new Error(`Booking failed: ${bookingResult.error}`);
  }
  const confirmedRes = bookingResult.reservation;
  console.log(`- Booking generated successfully with ID: ${confirmedRes.id}`);
  console.log(`- QR Code payload generated:`, confirmedRes.qrPayload);

  // Now verify conflict engine blocks double-booking of same slot!
  const isNowBooked = store.isSlotBooked(testRoom, testDate, testSlot);
  console.log(`- Post-check: isSlotBooked returned: ${isNowBooked}`);
  if (!isNowBooked) {
    throw new Error('Conflict engine failed: slot should now be booked');
  }

  // Attempt duplicate booking
  console.log(`- Attempting conflicting duplicate booking on same slot...`);
  const duplicateResult = await store.bookRoom(testRoom, testDate, testSlot);
  console.log(`- Duplicate booking result:`, duplicateResult);
  if (duplicateResult.success) {
    throw new Error('Conflict engine failed: Allowed duplicate booking on already reserved slot!');
  }
  console.log(`✓ Visual/logical conflict prevention blocked double-booking with message: "${duplicateResult.error}"`);

  // 5. Verify Check-in Action
  console.log(`\n[Test 5] Verifying Check-in Action...`);
  store.checkInBooking(confirmedRes.id);
  const updatedRes = useBookingStore
    .getState()
    .activeReservations.find((r) => r.id === confirmedRes.id);
  if (updatedRes?.status !== 'checked-in') {
    throw new Error('Check-in action failed to transition status to checked-in');
  }
  console.log(`✓ Reservation successfully transitioned to status: "${updatedRes.status}"`);

  // 6. Verify Cancellation & Real-time Slot Release
  console.log(`\n[Test 6] Verifying Cancellation & Slot Release...`);
  const cancelSuccess = await store.cancelBooking(confirmedRes.id);
  if (!cancelSuccess) throw new Error('Cancellation action returned false');

  // Verify slot is now free again
  const isFreeAfterCancel = !useBookingStore
    .getState()
    .isSlotBooked(testRoom, testDate, testSlot);
  console.log(`- Slot released after cancellation? ${isFreeAfterCancel}`);
  if (!isFreeAfterCancel) {
    throw new Error('Slot remained blocked after cancellation');
  }
  console.log('✓ Cancellation successfully released slot back to campus pool.');

  console.log('\n=============================================');
  console.log('🎉 ALL ENGINE VERIFICATION TESTS PASSED (6/6)');
  console.log('=============================================\n');
}

runVerification().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
