import {
  AppShell as MantineAppShell,
  useComputedColorScheme,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import { useWallet } from '../../hooks';
import { XcmRouterPage } from '../../routes';
import { Header } from './Header/Header';

export const AppShell = () => {
  const [opened, { toggle }] = useDisclosure();

  const {
    connectWallet,
    changeAccount,
    handleApiSwitch,
    apiType,
    isLoadingExtensions,
    isInitialized,
  } = useWallet();

  const onMobileMenuClick = () => {
    toggle();
  };

  const { setColorScheme } = useMantineColorScheme();

  const computedColorScheme = useComputedColorScheme('light');

  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');
  };

  const [pinned, setPinned] = useState(true);

  const onChangeAccountClick = () => void changeAccount();

  const onConnectWalletClick = () => void connectWallet();

  useEffect(() => {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        setPinned(false);
      } else {
        setPinned(true);
      }
    });
    return () => {
      window.removeEventListener('scroll', () => {});
    };
  }, []);

  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/' && apiType === 'PJS') {
      handleApiSwitch('PAPI');
    }
  }, [location.pathname, apiType]);

  const theme = useMantineTheme();

  const colorScheme = useComputedColorScheme();

  return (
    <MantineAppShell
      header={{ height: pinned ? 100 : 64, offset: false }}
      padding={{
        base: 16,
        xs: 24,
      }}
      style={{
        paddingTop: 48,
        paddingLeft: 0,
        paddingRight: 0,
      }}
      layout="alt"
    >
      <MantineAppShell.Header
        withBorder={false}
        px="xl"
        style={{
          transition:
            'height 100ms ease, box-shadow 100ms ease, background-color 100ms ease, backdrop-filter 100ms ease',
          boxShadow: pinned ? 'none' : theme.shadows.xs,
          zIndex: 105,
          clipPath: 'inset(0 -15px -150px 0)',
        }}
        bg={
          pinned ? 'transparent' : colorScheme === 'light' ? 'white' : 'dark.7'
        }
      >
        <Header
          onMenuClick={onMobileMenuClick}
          menuOpened={opened}
          apiTypeInitialized={isInitialized}
          isLoadingExtensions={isLoadingExtensions}
          isPinned={pinned}
          onApiTypeChange={handleApiSwitch}
          onChangeAccountClick={onChangeAccountClick}
          onConnectWalletClick={onConnectWalletClick}
          toggleColorScheme={toggleColorScheme}
          colorScheme={computedColorScheme}
        />
      </MantineAppShell.Header>
      <MantineAppShell.Main style={{ overflow: 'hidden' }}>
        <Routes>
          <Route path="/" Component={XcmRouterPage} />
        </Routes>
      </MantineAppShell.Main>
    </MantineAppShell>
  );
};
