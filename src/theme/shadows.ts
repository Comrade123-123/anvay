import { ViewStyle } from 'react-native';

export const shadows = {
  card: {
    shadowColor: '#13284B',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
} satisfies Record<string, ViewStyle>;
