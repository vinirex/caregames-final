import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const Container = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }} className={styles.container}>
      {children}
    </View>
  );
};

const styles = {
  container: 'flex flex-1 m-6',
};

