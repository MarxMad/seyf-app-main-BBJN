import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Progress } from './progress';

const meta: Meta<typeof Progress> = {
  title: 'UI/Progress',
  component: Progress,
  tags: ['autodocs'],
  args: { value: 60 },
};
export default meta;

type Story = StoryObj<typeof Progress>;

export const Default: Story = {};

export const Empty: Story = { args: { value: 0 } };

export const Full: Story = { args: { value: 100 } };

export const Partial: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-64">
      <Progress value={25} />
      <Progress value={50} />
      <Progress value={75} />
      <Progress value={100} />
    </div>
  ),
};
