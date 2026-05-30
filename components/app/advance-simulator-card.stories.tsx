import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AdvanceSimulatorCard } from './advance-simulator-card';

const meta: Meta<typeof AdvanceSimulatorCard> = {
  title: 'App/AdvanceSimulatorCard',
  component: AdvanceSimulatorCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    yieldBalance: 1250.75,
    annualRate: 0.115,
    onRequestAdvance: (amount) => alert(`Adelanto solicitado: $${amount.toFixed(2)}`),
  },
};
export default meta;

type Story = StoryObj<typeof AdvanceSimulatorCard>;

export const Default: Story = {};

export const LowBalance: Story = {
  args: { yieldBalance: 50, annualRate: 0.115 },
};

export const ZeroBalance: Story = {
  args: { yieldBalance: 0, annualRate: 0.115 },
};
