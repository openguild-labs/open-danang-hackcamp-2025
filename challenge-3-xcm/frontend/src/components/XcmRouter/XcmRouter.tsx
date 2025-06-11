/* eslint-disable no-console */
import {
  Box,
  Center,
  Container,
  Group,
  Image,
  Loader,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
  Anchor,
  Alert,
} from '@mantine/core';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import {
  getOtherAssets,
  isForeignAsset,
  replaceBigInt,
  type TAsset,
  type TCurrencyInput,
  type TNodeDotKsmWithRelayChains,
} from '@paraspell/sdk';
import type {
  TExchangeInput,
  TExchangeNode,
  TRouterEvent,
  TTransaction,
} from '@paraspell/xcm-router';
import { createDexNodeInstance, RouterBuilder } from '@paraspell/xcm-router';
import axios, { AxiosError } from 'axios';
import { ethers } from 'ethers';
import { Binary, createClient, type PolkadotSigner } from 'polkadot-api';
import { withPolkadotSdkCompat } from 'polkadot-api/polkadot-sdk-compat';
import { getWsProvider } from 'polkadot-api/ws-provider/web';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

import type { TRouterFormValuesTransformed } from './XcmRouterForm';
import { XcmRouterForm } from './XcmRouterForm';
import { API_URL } from '../../consts';
import { useWallet } from '../../hooks';
import type { TRouterSubmitType } from '../../types';
import { fetchFromApi, submitTransactionPapi } from '../../utils';
import {
  showErrorNotification,
  showLoadingNotification,
  showSuccessNotification,
} from '../../utils/notifications';
import { ErrorAlert } from '../common/ErrorAlert';
import { OutputAlert } from '../common/OutputAlert';
import { TransferStepper } from './TransferStepper';

function getExplorerUrl(destination: string, txHash: string) {
  switch (destination.toLowerCase()) {
    case 'polkadot':
      return `https://polkadot.subscan.io/extrinsic/${txHash}`;
    case 'kusama':
      return `https://kusama.subscan.io/extrinsic/${txHash}`;
    case 'hydration':
      return `https://hydration.subscan.io/extrinsic/${txHash}`;
    case 'bifrostpolkadot':
      return `https://bifrost.subscan.io/extrinsic/${txHash}`;
    case 'bridgehubpolkadot':
      return `https://bridgehub-polkadot.subscan.io/extrinsic/${txHash}`;
    case 'bridgehubkusama':
      return `https://bridgehub-kusama.subscan.io/extrinsic/${txHash}`;
    case 'centrifuge':
      return `https://centrifuge.subscan.io/extrinsic/${txHash}`;
    case 'composablefinance':
      return `https://composable.subscan.io/extrinsic/${txHash}`;
    case 'darwinia':
      return `https://darwinia.subscan.io/extrinsic/${txHash}`;
    case 'interlay':
      return `https://interlay.subscan.io/extrinsic/${txHash}`;
    case 'coretimepolkadot':
      return `https://coretime-polkadot.subscan.io/extrinsic/${txHash}`;
    case 'coretimekusama':
      return `https://coretime-kusama.subscan.io/extrinsic/${txHash}`;
    case 'astar':
      return `https://astar.subscan.io/extrinsic/${txHash}`;
    case 'ajuna':
      return `https://ajuna.subscan.io/extrinsic/${txHash}`;
    case 'encointer':
      return `https://encointer.subscan.io/extrinsic/${txHash}`;
    case 'heima':
      return `https://heima.subscan.io/extrinsic/${txHash}`;
    case 'moonbeam':
      return `https://moonbeam.subscan.io/extrinsic/${txHash}`;
    case 'karura':
      return `https://karura.subscan.io/extrinsic/${txHash}`;
    case 'kintsugi':
      return `https://kintsugi.subscan.io/extrinsic/${txHash}`;
    case 'moonriver':
      return `https://moonriver.subscan.io/extrinsic/${txHash}`;
    case 'quartz':
      return `https://quartz.subscan.io/extrinsic/${txHash}`;
    case 'robonomicskusama':
      return `https://robonomics-freemium.subscan.io/extrinsic/${txHash}`;
    case 'robonomicspolkadot':
      return `https://robonomics.subscan.io/extrinsic/${txHash}`;
    case 'peoplepolkadot':
      return `https://people-polkadot.subscan.io/extrinsic/${txHash}`;
    case 'peoplekusama':
      return `https://people-kusama.subscan.io/extrinsic/${txHash}`;
    case 'shiden':
      return `https://shiden.subscan.io/extrinsic/${txHash}`;
    case 'unique':
      return `https://unique.subscan.io/extrinsic/${txHash}`;
    case 'crust':
      return `https://crust-parachain.subscan.io/extrinsic/${txHash}`;
    case 'manta':
      return `https://manta.subscan.io/extrinsic/${txHash}`;
    case 'nodle':
      return `https://nodle.subscan.io/extrinsic/${txHash}`;
    case 'phala':
      return `https://phala.subscan.io/extrinsic/${txHash}`;
    case 'subsocial':
      return `https://subsocial.subscan.io/extrinsic/${txHash}`;
    case 'peaq':
      return `https://peaq.subscan.io/extrinsic/${txHash}`;
    case 'polimec':
      return `https://polimec.subscan.io/extrinsic/${txHash}`;
    case 'zeitgeist':
      return `https://zeitgeist.subscan.io/extrinsic/${txHash}`;
    case 'collectives':
      return `https://collectives.subscan.io/extrinsic/${txHash}`;
    // Add more chains as needed
    default:
      return `https://polkadot.subscan.io/extrinsic/${txHash}`;
  }
}

export const XcmRouter = () => {
  const { selectedAccount, getSigner } = useWallet();

  const [alertOpened, { open: openAlert, close: closeAlert }] =
    useDisclosure(false);

  const [
    outputAlertOpened,
    { open: openOutputAlert, close: closeOutputAlert },
  ] = useDisclosure(false);

  const [output, setOutput] = useState<string>();

  const [error, setError] = useState<Error>();

  const [loading, setLoading] = useState(false);

  const [progressInfo, setProgressInfo] = useState<TRouterEvent>();

  const [showStepper, setShowStepper] = useState(false);

  const [runConfetti, setRunConfetti] = useState(false);

  const [successTxHash, setSuccessTxHash] = useState<string | null>(null);

  const [successTxDestination, setSuccessTxDestination] = useState<
    string | null
  >(null);

  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    offset: 0,
  });

  useEffect(() => {
    if (error) {
      scrollIntoView();
    }
  }, [error, scrollIntoView]);

  useEffect(() => {
    if (showStepper) {
      scrollIntoView();
    }
  }, [showStepper, scrollIntoView]);

  const onStatusChange = (status: TRouterEvent) => {
    setProgressInfo(status);
  };

  const determineCurrency = (
    node: TNodeDotKsmWithRelayChains | undefined,
    asset: TAsset,
    isAutoExchange = false
  ): TCurrencyInput => {
    if (!isForeignAsset(asset)) {
      return { symbol: asset.symbol };
    }

    if (asset.assetId === undefined && asset.multiLocation === undefined) {
      return { symbol: asset.symbol };
    }

    if (ethers.isAddress(asset.assetId)) {
      return { symbol: asset.symbol };
    }

    if (isAutoExchange) {
      return asset.multiLocation
        ? { multilocation: asset.multiLocation }
        : { symbol: asset.symbol };
    }

    const hasDuplicateIds =
      node &&
      getOtherAssets(node).filter(
        (other) =>
          other.assetId !== undefined && other.assetId === asset.assetId
      ).length > 1;

    if (hasDuplicateIds) {
      return { symbol: asset.symbol };
    }

    if (asset.multiLocation) return { multilocation: asset.multiLocation };

    if (asset.assetId) return { id: asset.assetId };

    throw new Error('Invalid currency input');
  };

  const submitUsingRouterModule = async (
    formValues: TRouterFormValuesTransformed,
    exchange: TExchangeInput,
    senderAddress: string,
    signer: PolkadotSigner
  ) => {
    const {
      from,
      to,
      currencyFrom,
      currencyTo,
      amount,
      recipientAddress,
      evmInjectorAddress: evmSenderAddress,
      slippagePct,
      evmSigner,
    } = formValues;

    await RouterBuilder()
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(
        determineCurrency(
          from
            ? from
            : exchange && !Array.isArray(exchange)
            ? createDexNodeInstance(exchange).node
            : undefined,
          currencyFrom
        )
      )
      .currencyTo(
        determineCurrency(
          exchange && !Array.isArray(exchange)
            ? createDexNodeInstance(exchange).node
            : undefined,
          currencyTo,
          exchange === undefined || Array.isArray(exchange)
        )
      )
      .amount(amount)
      .senderAddress(senderAddress)
      .recipientAddress(recipientAddress)
      .evmSenderAddress(evmSenderAddress)
      .signer(signer)
      .evmSigner(evmSigner)
      .slippagePct(slippagePct)
      .onStatusChange(onStatusChange)
      .build();
  };

  const submitUsingApi = async (
    formValues: TRouterFormValuesTransformed,
    exchange: TExchangeNode | TExchangeNode[] | undefined,
    senderAddress: string,
    signer: PolkadotSigner
  ) => {
    const { currencyFrom, currencyTo } = formValues;
    try {
      const response = await axios.post(
        `${API_URL}/router`,
        {
          ...formValues,
          currencyFrom: { symbol: currencyFrom.symbol },
          currencyTo: { symbol: currencyTo.symbol },
          exchange: exchange ?? undefined,
          senderAddress,
        },
        {
          timeout: 120000,
        }
      );

      const transactions = (await response.data) as (TTransaction & {
        wsProviders: string[];
      })[];

      for (const [
        index,
        { node, type, wsProviders, tx },
      ] of transactions.entries()) {
        onStatusChange({
          node,
          type,
          currentStep: index,
          routerPlan: transactions,
        });

        const api = createClient(
          withPolkadotSdkCompat(getWsProvider(wsProviders))
        );

        await submitTransactionPapi(
          await api
            .getUnsafeApi()
            .txFromCallData(Binary.fromHex(tx as unknown as string)),
          // When submitting to exchange, prioritize the evmSigner if available
          type === 'TRANSFER' && index === 0
            ? signer
            : formValues.evmSigner ?? signer
        );
      }

      onStatusChange({
        type: 'COMPLETED',
        node: transactions[transactions.length - 1].node,
        currentStep: transactions.length - 1,
        routerPlan: transactions,
      });
    } catch (error) {
      if (error instanceof AxiosError) {
        showErrorNotification('Error while fetching data.');
        console.error(error);
        let errorMessage = 'Error while fetching data.';
        if (error.response === undefined) {
          errorMessage += ' Make sure the API is running.';
        } else {
          // Append the server-provided error message if available
          const serverMessage =
            error.response.data &&
            (error.response.data as { message: string }).message
              ? ' Server response: ' +
                (error.response.data as { message: string }).message
              : '';
          errorMessage += serverMessage;
        }
        throw new Error(errorMessage);
      } else if (error instanceof Error) {
        console.error(error);
        throw new Error(error.message);
      }
    }
  };

  const submitGetXcmFee = async (
    formValues: TRouterFormValuesTransformed,
    exchange: TExchangeNode | undefined,
    senderAddress: string
  ) => {
    const {
      useApi,
      from,
      to,
      currencyFrom,
      currencyTo,
      amount,
      recipientAddress,
      evmInjectorAddress: evmSenderAddress,
      slippagePct,
    } = formValues;

    setLoading(true);

    try {
      let result;
      if (useApi) {
        result = await fetchFromApi(
          formValues,
          '/router/xcm-fees',
          'POST',
          true
        );
      } else {
        result = await RouterBuilder()
          .from(from)
          .exchange(exchange)
          .to(to)
          .currencyFrom(
            determineCurrency(
              from
                ? from
                : exchange && !Array.isArray(exchange)
                ? createDexNodeInstance(exchange).node
                : undefined,
              currencyFrom
            )
          )
          .currencyTo(
            determineCurrency(
              exchange && !Array.isArray(exchange)
                ? createDexNodeInstance(exchange).node
                : undefined,
              currencyTo,
              exchange === undefined || Array.isArray(exchange)
            )
          )
          .amount(amount)
          .senderAddress(senderAddress)
          .recipientAddress(recipientAddress)
          .evmSenderAddress(evmSenderAddress)
          .slippagePct(slippagePct)
          .onStatusChange(onStatusChange)
          .getXcmFees();
      }
      setOutput(JSON.stringify(result, replaceBigInt, 2));
      openOutputAlert();
      closeAlert();
      showSuccessNotification(undefined, 'Success', 'XCM fee calculated');
    } catch (e) {
      if (e instanceof Error) {
        console.error(e);
        showErrorNotification(e.message);
        setError(e);
        openAlert();
        setShowStepper(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitGetBestAmountOut = async (
    formValues: TRouterFormValuesTransformed,
    exchange: TExchangeNode | undefined
  ) => {
    const { useApi, from, to, currencyFrom, currencyTo } = formValues;

    setLoading(true);

    try {
      let result;
      if (useApi) {
        result = await fetchFromApi(
          formValues,
          '/router/best-amount-out',
          'POST',
          true
        );
      } else {
        result = await RouterBuilder()
          .from(from)
          .exchange(exchange)
          .to(to)
          .currencyFrom(
            determineCurrency(
              from
                ? from
                : exchange && !Array.isArray(exchange)
                ? createDexNodeInstance(exchange).node
                : undefined,
              currencyFrom
            )
          )
          .currencyTo(
            determineCurrency(
              exchange && !Array.isArray(exchange)
                ? createDexNodeInstance(exchange).node
                : undefined,
              currencyTo,
              exchange === undefined || Array.isArray(exchange)
            )
          )
          .amount(formValues.amount)
          .getBestAmountOut();
      }
      setOutput(JSON.stringify(result, replaceBigInt, 2));
      openOutputAlert();
      closeAlert();
      showSuccessNotification(undefined, 'Success', 'Best amount fetched');
    } catch (e) {
      if (e instanceof Error) {
        console.error(e);
        showErrorNotification(e.message);
        setError(e);
        openAlert();
        setShowStepper(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const submit = async (
    formValues: TRouterFormValuesTransformed,
    submitType: TRouterSubmitType
  ) => {
    const { useApi } = formValues;
    if (!selectedAccount) {
      showErrorNotification('No account selected, connect wallet first');
      throw Error('No account selected!');
    }

    closeOutputAlert();

    const exchange = (
      formValues.exchange && formValues.exchange?.length > 1
        ? formValues.exchange
        : formValues.exchange?.[0]
    ) as TExchangeNode | undefined;

    if (submitType === 'getBestAmountOut') {
      await submitGetBestAmountOut(formValues, exchange);
      return;
    }

    if (submitType === 'getXcmFee') {
      await submitGetXcmFee(formValues, exchange, selectedAccount.address);
      return;
    }

    setLoading(true);
    const notifId = showLoadingNotification(
      'Processing',
      'Transaction is being processed'
    );

    const signer = await getSigner();

    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      if (
        args.length > 1 &&
        typeof args[2] === 'string' &&
        args[2].includes('ExtrinsicStatus::')
      ) {
        const error = new Error(args[2]);
        showErrorNotification(error.message, notifId);
        setError(error);
        openAlert();
        setShowStepper(false);
        setLoading(false);
      } else {
        originalError(...args);
        setProgressInfo(undefined);
      }
    };

    try {
      setShowStepper(true);
      setProgressInfo(undefined);
      if (useApi) {
        // Assume submitUsingApi returns the tx hash if available
        const txHash = await submitUsingApi(
          formValues,
          exchange,
          selectedAccount.address,
          signer as PolkadotSigner
        );
        if (typeof txHash === 'string') {
          setSuccessTxHash(txHash);
          setSuccessTxDestination(formValues.to as string);
        }
      } else {
        // Assume submitUsingRouterModule returns the tx hash if available
        const txHash = await submitUsingRouterModule(
          formValues,
          exchange,
          selectedAccount.address,
          signer as PolkadotSigner
        );
        if (typeof txHash === 'string') {
          setSuccessTxHash(txHash);
          setSuccessTxDestination(formValues.to as string);
        }
      }
      setRunConfetti(true);
      showSuccessNotification(
        notifId ?? '',
        'Success',
        'Transaction was successful'
      );
    } catch (e) {
      if (e instanceof Error) {
        console.error(e);
        showErrorNotification(e.message, notifId);
        setError(e);
        openAlert();
        setShowStepper(false);
      }
    } finally {
      setLoading(false);
      setShowStepper(false);
    }
    setLoading(false);
  };

  const onSubmit = (
    formValues: TRouterFormValuesTransformed,
    submitType: TRouterSubmitType
  ) => void submit(formValues, submitType);

  const onAlertCloseClick = () => {
    closeAlert();
  };

  const onConfettiComplete = () => {
    setRunConfetti(false);
  };

  const theme = useMantineColorScheme();

  const width = window.innerWidth;
  const height = document.body.scrollHeight;

  const onOutputAlertCloseClick = () => closeOutputAlert();

  return (
    <Container px="xl" pb="128">
      <Stack gap="xl">
        <Stack w="100%" maw={460} mx="auto" gap="0">
          <Box px="xl" pb="xl">
            <Center>
              <Image src="/og-logo.png" fit="contain" w={220} p={8} />
            </Center>

            <Text
              size="xs"
              c={theme.colorScheme === 'light' ? 'gray.7' : 'dark.1'}
              fw={700}
              ta="center"
            >
              Easily exchange and transfer cross-chain assets between two
              parachains using XCM and HydrationDex.
            </Text>
          </Box>

          <XcmRouterForm onSubmit={onSubmit} loading={loading} />
        </Stack>
        <Box ref={targetRef}>
          {progressInfo && progressInfo?.type === 'SELECTING_EXCHANGE' && (
            <Center>
              <Group mt="md">
                <Loader />
                <Title order={4}>Searching for best exchange rate</Title>
              </Group>
            </Center>
          )}
          {showStepper && progressInfo?.type !== 'SELECTING_EXCHANGE' && (
            <Center mt="md">
              <TransferStepper progressInfo={progressInfo} />
            </Center>
          )}
          {alertOpened && (
            <ErrorAlert onAlertCloseClick={onAlertCloseClick}>
              {error?.message.split('\n\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </ErrorAlert>
          )}
        </Box>
        <Box>
          {outputAlertOpened && output && (
            <OutputAlert output={output} onClose={onOutputAlertCloseClick} />
          )}
          {successTxHash && successTxDestination && (
            <Alert title="Transaction Success" color="green" mt="md">
              Transaction submitted! Hash:
              <br />
              <Anchor
                href={getExplorerUrl(successTxDestination, successTxHash)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {successTxHash}
              </Anchor>
            </Alert>
          )}
        </Box>
      </Stack>
      <Confetti
        run={runConfetti}
        recycle={false}
        numberOfPieces={500}
        tweenDuration={10000}
        onConfettiComplete={onConfettiComplete}
        width={width}
        height={height}
      />
    </Container>
  );
};
