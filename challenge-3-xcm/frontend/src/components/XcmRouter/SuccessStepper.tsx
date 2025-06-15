import { Anchor, Stepper } from '@mantine/core';
import { IconCoinFilled } from '@tabler/icons-react';
import type { FC } from 'react';

interface Props {
  txHash: string;
  destination: string;
  getExplorerUrl: (destination: string, txHash: string) => string;
}

export const SuccessStepper: FC<Props> = ({
  txHash,
  destination,
  getExplorerUrl,
}) => {
  const explorerUrl = getExplorerUrl(destination, txHash);

  return (
    <Stepper active={2} size="sm" color="teal" orientation="horizontal">
      <Stepper.Step
        label="Step 1"
        description="Select chains"
        completedIcon={<IconCoinFilled size={14} />}
      />
      <Stepper.Step
        label="Step 2"
        description="Enter details"
        completedIcon={<IconCoinFilled size={14} />}
      />
      <Stepper.Step
        label="Success"
        description={
          <Anchor href={explorerUrl} target="_blank" rel="noopener noreferrer">
            {txHash.slice(0, 6)}...{txHash.slice(-4)}
          </Anchor>
        }
        completedIcon={<IconCoinFilled size={14} />}
      />
    </Stepper>
  );
};
