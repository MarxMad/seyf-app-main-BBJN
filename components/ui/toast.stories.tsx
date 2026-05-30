import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from './toast';

const meta: Meta = {
  title: 'UI/Toast',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
        <ToastViewport />
      </ToastProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Toast open>
      <div className="flex flex-col gap-1">
        <ToastTitle>Operación exitosa</ToastTitle>
        <ToastDescription>Tu depósito fue procesado correctamente.</ToastDescription>
      </div>
      <ToastClose />
    </Toast>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Toast open variant="destructive">
      <div className="flex flex-col gap-1">
        <ToastTitle>Error</ToastTitle>
        <ToastDescription>No se pudo completar la operación. Intenta de nuevo.</ToastDescription>
      </div>
      <ToastClose />
    </Toast>
  ),
};
