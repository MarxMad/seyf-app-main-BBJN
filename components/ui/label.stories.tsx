import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Label } from './label';
import { Input } from './input';

const meta: Meta<typeof Label> = {
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: { children: 'Número de teléfono' },
};

export const WithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="phone">Número de teléfono</Label>
      <Input id="phone" type="tel" placeholder="5512345678" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64" data-disabled="true">
      <Label htmlFor="phone-disabled">Teléfono (deshabilitado)</Label>
      <Input id="phone-disabled" type="tel" disabled placeholder="5512345678" />
    </div>
  ),
};
