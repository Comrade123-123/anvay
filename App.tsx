import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppFonts } from './src/theme/useAppFonts';
import { TabKey } from './src/components/BottomTabBar';
import { SplashScreen } from './src/screens/SplashScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { DbtScreen } from './src/screens/DbtScreen';
import { JourneyScreen } from './src/screens/JourneyScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { SchemesScreen } from './src/screens/SchemesScreen';
import { SchemeDetailScreen } from './src/screens/SchemeDetailScreen';
import { ApplyFormScreen, resetApplyForm } from './src/screens/ApplyFormScreen';
import { ApplyDocsScreen, resetDocsProgress } from './src/screens/ApplyDocsScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { SwitchScholarshipScreen } from './src/screens/SwitchScholarshipScreen';
import { AadhaarSeedingScreen } from './src/screens/AadhaarSeedingScreen';
import { OfflineSyncScreen } from './src/screens/OfflineSyncScreen';
import { ScholarshipsScreen } from './src/screens/ScholarshipsScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { HelpScreen } from './src/screens/HelpScreen';
import { ReviewSubmitScreen } from './src/screens/ReviewSubmitScreen';
import { SubmittedScreen } from './src/screens/SubmittedScreen';
import { ToastProvider } from './src/components/Toast';
import { DeviceFrame } from './src/components/DeviceFrame';

type Route = 'splash' | 'welcome' | 'login' | 'home' | 'profile' | 'dbt' | 'journey' | 'wallet' | 'schemes' | 'scheme' | 'apply' | 'docs' | 'notifications' | 'switch' | 'seeding' | 'offline' | 'scholarships' | 'calendar' | 'chat' | 'help' | 'review' | 'submitted';

export default function App() {
  const fontsLoaded = useAppFonts();
  // Simple route state + a history stack (no navigation library). `go` pushes the current screen so Back returns to
  // whichever screen actually opened the current one; `reset` is used for top-level jumps (tabs, login, home).
  const [route, setRoute] = useState<Route>('splash');
  const [stack, setStack] = useState<Route[]>([]);

  const go = (to: Route) => {
    setStack((s) => [...s, route]);
    setRoute(to);
  };
  const back = (fallback: Route = 'home') => {
    if (stack.length) {
      setRoute(stack[stack.length - 1]);
      setStack((s) => s.slice(0, -1));
    } else {
      setRoute(fallback);
    }
  };
  // Android hardware back: step back through the app's own history; on the top-level screens let the OS handle it.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route === 'splash' || route === 'welcome') return false;
      if (route === 'home' && !stack.length) return false;
      if (route === 'login') {
        reset('welcome');
        return true;
      }
      back();
      return true;
    });
    return () => sub.remove();
  });
  const reset = useCallback((to: Route, base: Route[] = []) => {
    setStack(base);
    setRoute(to);
  }, []);

  const goWelcome = useCallback(() => reset('welcome'), [reset]);
  const goLogin = useCallback(() => reset('login', ['welcome']), [reset]);
  // Let the green "Verified" state show briefly before moving on (mock login, no real auth).
  const goHome = useCallback(() => {
    setTimeout(() => reset('home'), 700);
  }, [reset]);
  // Every bottom tab has a page now, so the tab key is also the route.
  const onTabSelect = useCallback(
    (key: TabKey) => {
      // The Schemes tab lands on the Scholarships hub; the full directory is one tap away ("All schemes").
      reset(key === 'schemes' ? 'scholarships' : key);
    },
    [reset],
  );

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#13294B' }} />;
  return (
    <SafeAreaProvider>
      <DeviceFrame>
      <ToastProvider>
        <StatusBar style="light" />
        {route === 'splash' && <SplashScreen onFinish={goWelcome} />}
        {route === 'welcome' && <WelcomeScreen onGetStarted={goLogin} onLogin={goLogin} />}
        {route === 'login' && <LoginScreen onBack={goWelcome} onVerified={goHome} />}
        {route === 'home' && (
          <HomeScreen
            onTabSelect={onTabSelect}
            onOpenDbt={() => go('dbt')}
            onOpenJourney={() => go('journey')}
            onOpenSchemes={() => go('scholarships')}
            onOpenWallet={() => go('wallet')}
            onOpenNotifications={() => go('notifications')}
            onOpenCalendar={() => go('calendar')}
            onOpenChat={() => go('chat')}
            onOpenHelp={() => go('help')}
            onOpenSeeding={() => go('seeding')}
          />
        )}
        {route === 'help' && (
          <HelpScreen
            onBack={() => back()}
            onTabSelect={onTabSelect}
            onAskJago={() => go('chat')}
            onNotifications={() => go('notifications')}
          />
        )}
        {route === 'chat' && <ChatScreen onBack={() => back()} onOpenDetails={() => go('journey')} onUpload={() => go('docs')} />}
        {route === 'calendar' && (
          <CalendarScreen
            onBack={() => back()}
            onTabSelect={onTabSelect}
            onDoItNow={() => go('wallet')}
            onApply={() => go('scheme')}
          />
        )}
        {route === 'notifications' && (
          <NotificationsScreen onBack={() => back()} onTabSelect={onTabSelect} onNavigate={(to) => go(to)} />
        )}
        {route === 'wallet' && (
          <WalletScreen onBack={() => back()} onTabSelect={onTabSelect} onNotifications={() => go('notifications')} />
        )}
        {route === 'schemes' && (
          <SchemesScreen
            onBack={() => back()}
            onTabSelect={onTabSelect}
            onOpenScheme={() => go('scheme')}
            onOpenChat={() => go('chat')}
            onOpenHelp={() => go('help')}
          />
        )}
        {route === 'scheme' && <SchemeDetailScreen onBack={() => back('schemes')} onApply={() => go('switch')} />}
        {route === 'switch' && (
          <SwitchScholarshipScreen onBack={() => back('scheme')} onKeep={() => back('scheme')} onSwitch={() => {
              resetDocsProgress();
              resetApplyForm();
              go('apply');
            }} />
        )}
        {route === 'apply' && <ApplyFormScreen onBack={() => back('switch')} onContinue={() => go('docs')} />}
        {route === 'docs' && <ApplyDocsScreen onBack={() => back('apply')} onContinue={() => go('review')} />}
        {route === 'review' && <ReviewSubmitScreen onBack={() => back('docs')} onSubmitted={() => go('submitted')} />}
        {route === 'submitted' && (
          <SubmittedScreen
            onClose={() => reset('home')}
            onHome={() => reset('home')}
            onTrack={() => reset('journey', ['home'])}
          />
        )}
        {route === 'journey' && (
          <JourneyScreen
            onBack={() => back()}
            onTabSelect={onTabSelect}
            onRaiseGrievance={() => go('help')}
            onNotifications={() => go('notifications')}
          />
        )}
        {route === 'dbt' && (
          <DbtScreen
            onBack={() => back()}
            onTabSelect={onTabSelect}
            onFixSeeding={() => go('seeding')}
            onNotifications={() => go('notifications')}
          />
        )}
        {route === 'scholarships' && (
          <ScholarshipsScreen
            onOpenChat={() => go('chat')}
            onTabSelect={onTabSelect}
            onOpenDirectory={() => go('schemes')}
            onDetails={() => go('scheme')}
            onApply={() => go('switch')}
            onCurrent={() => go('journey')}
          />
        )}
        {route === 'seeding' && <AadhaarSeedingScreen onBack={() => back('dbt')} onOpenHelp={() => go('help')} />}
        {route === 'offline' && <OfflineSyncScreen onBack={() => back('profile')} />}
        {route === 'profile' && (
          <ProfileScreen
            onTabSelect={onTabSelect}
            onLogout={goWelcome}
            onOpenOffline={() => go('offline')}
            onOpenHelp={() => go('help')}
            onOpenSeeding={() => go('seeding')}
          />
        )}
      </ToastProvider>
      </DeviceFrame>
    </SafeAreaProvider>
  );
}
