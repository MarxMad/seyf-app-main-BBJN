import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input } from './input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: 'Escribe aquí…' },
};

export const WithValue: Story = {
  args: { defaultValue: '5512345678', type: 'tel' },
};

export const Disabled: Story = {
  args: { placeholder: 'Campo deshabilitado', disabled: true },
};

export const Invalid: Story = {
  args: { placeholder: 'Campo inválido', 'aria-invalid': true },
};
