import {
  Anchor,
  Button,
  Center,
  CopyButton,
  Group,
  Modal,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconCheck, IconCopy, IconExternalLink } from '@tabler/icons-react';
import type { FC } from 'react';

interface Props {
  opened: boolean;
  onClose: () => void;
  txHash: string;
  destination: string;
  getExplorerUrl: (destination: string, txHash: string) => string;
}

/**
 * Displays a modal with the transaction hash and useful links.
 */
export const TransactionStatusModal: FC<Props> = ({
  opened,
  onClose,
  txHash,
  destination,
  getExplorerUrl,
}) => {
  const explorerUrl = getExplorerUrl(destination, txHash);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      withCloseButton
      title={null}
    >
      <Stack align="center" gap="md">
        <Title order={3}>Transaction Status</Title>
        <Text size="sm" c="dimmed">
          Track your transaction progress below
        </Text>

        <Stack gap="xs" w="100%">
          <Text fw={600} size="sm">
            Transaction Hash:
          </Text>
          <Group gap="xs" wrap="nowrap">
            <Anchor
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              fw={700}
              fz="sm"
            >
              {txHash.slice(0, 6)}...{txHash.slice(-4)}
            </Anchor>
            <Anchor
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconExternalLink size={16} />
            </Anchor>
            <CopyButton value={txHash} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow>
                  <Button variant="subtle" size="xs" px={4} onClick={copy}>
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </Button>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        </Stack>

        <Center>
          <Button onClick={onClose} w="120">
            Close
          </Button>
        </Center>
      </Stack>
    </Modal>
  );
};
