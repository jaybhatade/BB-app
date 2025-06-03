import './global.css';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { DatabaseProvider } from './src/contexts/DatabaseContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useFonts } from 'expo-font';
import { useTheme , ThemeProvider} from './src/contexts/ThemeContext';

export default function App() {
  const [fontsLoaded] = useFonts({
    "Figtree-Regular": require("./assets/fonts/Figtree-Regular.ttf"),
    "Figtree-Medium": require("./assets/fonts/Figtree-Medium.ttf"),
    "Figtree-SemiBold": require("./assets/fonts/Figtree-SemiBold.ttf"),
    "Figtree-Bold": require("./assets/fonts/Figtree-Bold.ttf"),
    "Figtree-ExtraBold": require("./assets/fonts/Figtree-ExtraBold.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <DatabaseProvider>
            <StatusBarWrapper />
            <AppNavigator />
          </DatabaseProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function StatusBarWrapper() {
  const { isDarkMode } = useTheme();
  return (
    <StatusBar 
      barStyle={isDarkMode ? "light-content" : "dark-content"}
      backgroundColor={isDarkMode ? "#0F172A" : "#FFFFFF"}
    />
  );
}
