import { Card, Group, Text, Loader, Image, Stack } from '@mantine/core';
import type { FC } from 'react';

import type { TAsset, TNodeWithRelayChains } from '@paraspell/sdk';
import { getParachainIcon } from '../../utils/getParachainIcon';
import { useAssetBalance } from '../../hooks/useAssetBalance';

interface Props {
  node: TNodeWithRelayChains;
  asset: TAsset;
  address: string;
  title?: string;
}

const BalanceCard: FC<Props> = ({ node, asset, address, title }) => {
  const { balance, loading, error } = useAssetBalance(node, asset, address);
  const icon = getParachainIcon(node);

  return (
    <Card withBorder radius="lg" padding="md" style={{ minWidth: 220 }}>
      <Stack gap="xs" align="center">
        {title && (
          <Text size="xs" fw={600} c="dimmed">
            {title}
          </Text>
        )}

        <Group gap="xs" align="center">
          {icon && <Image src={icon} w={24} h={24} radius="xl" />}
          <Text fw={700}>{node}</Text>
        </Group>

        <Text size="sm" c="dimmed">
          Asset: {asset.symbol}
        </Text>

        {loading ? (
          <Loader size="sm" />
        ) : error ? (
          <Text size="xs" c="red.6">
            Failed to load
          </Text>
        ) : (
          <Text size="lg" fw={700}>
            {balance ?? '--'}
          </Text>
        )}
      </Stack>
    </Card>
  );
};

export default BalanceCard;
