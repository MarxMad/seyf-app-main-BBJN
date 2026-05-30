import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { vi } from 'vitest';
import type { ClabeRecord } from '@/lib/seyf/bitso-service';

vi.mock('@/lib/seyf/use-seyf-wallet', () => ({
  useSeyfWallet: () => ({
    wallet: { stellarAddress: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37' },
    loading: false,
    error: null,
  }),
}));

const { ClabeDisplayCard } = await import('./clabe-display-card');

const mockClabe: ClabeRecord = {
  clabe: '646180157000000004',
  type: 'AUTO_PAYMENT',
  status: 'ENABLED',
  deposit_minimum_amount: 10,
  deposit_maximum_amounts: {
    operation: 50000,
    daily: 100000,
    weekly: 300000,
    monthly: 1000000,
  },
  created_at: new Date().toISOString(),
  updated_at: null,
  stellarAddress: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
  savedAt: new Date().toISOString(),
};

const meta: Meta<typeof ClabeDisplayCard> = {
  title: 'App/ClabeDisplayCard',
  component: ClabeDisplayCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof ClabeDisplayCard>;

export const WithClabe: Story = {
  args: { initialClabe: mockClabe },
};

export const NoClabe: Story = {
  args: { initialClabe: null },
};

export const DisabledClabe: Story = {
  args: { initialClabe: { ...mockClabe, status: 'DISABLED' } },
};
