export type MainTabParamList = {
  HomeTab: undefined;
  MyBookingsTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  RoomDetail: { roomId: string };
  Auth: { mode?: 'login' | 'register' } | undefined;
};

