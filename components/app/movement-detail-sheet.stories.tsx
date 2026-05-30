import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { UserMovement } from '@/lib/seyf/user-movements-types';
import { MovementDetailSheet } from './movement-detail-sheet';

const mockDeposit: UserMovement = {
  id: 'mov-001',
  source: 'etherfuse',
  tipo: 'deposito',
  titulo: 'Depósito SPEI',
  monto: 500,
  createdAt: new Date(Date.now() - 3600_000).toISOString(),
  estado: 'completado',
  detalle: 'Transferencia recibida desde BBVA',
  orderId: 'ef-order-abc123',
  stellarTxSignature: null,
};

const mockWithdrawal: UserMovement = {
  id: 'mov-002',
  source: 'stellar',
  tipo: 'retiro',
  titulo: 'Retiro a banco',
  monto: -200,
  createdAt: new Date(Date.now() - 7200_000).toISOString(),
  estado: 'completado',
  detalle: 'Retiro procesado vía SPEI',
  orderId: null,
  stellarTxSignature: 'abc123def456abc123def456abc123def456abc123def456abc123def456abc123',
  stellarNetwork: 'testnet',
};

const mockPending: UserMovement = {
  id: 'mov-003',
  source: 'etherfuse',
  tipo: 'deposito',
  titulo: 'Depósito en proceso',
  monto: 1000,
  createdAt: new Date().toISOString(),
  estado: 'pendiente',
  detalle: 'Esperando confirmación bancaria',
  orderId: 'ef-order-pending',
  stellarTxSignature: null,
};

const meta: Meta<typeof MovementDetailSheet> = {
  title: 'App/MovementDetailSheet',
  component: MovementDetailSheet,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onClose: () => {} },
  beforeEach() {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
  },
};
export default meta;

type Story = StoryObj<typeof MovementDetailSheet>;

export const Deposit: Story = {
  args: {
    movement: mockDeposit,
    icon: <ArrowDownLeft className="size-5 text-emerald-500" />,
  },
};

export const WithdrawalWithTx: Story = {
  args: {
    movement: mockWithdrawal,
    icon: <ArrowUpRight className="size-5 text-foreground" />,
  },
};

export const Pending: Story = {
  args: {
    movement: mockPending,
    icon: <ArrowDownLeft className="size-5 text-amber-500" />,
  },
};

export const Closed: Story = {
  args: { movement: null, icon: null },
};
