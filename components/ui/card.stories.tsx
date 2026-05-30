import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Button } from './button';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Saldo disponible</CardTitle>
        <CardDescription>Tu balance actual en MXNe</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-black">$1,234.56</p>
      </CardContent>
      <CardFooter>
        <Button size="sm" className="w-full">Retirar</Button>
      </CardFooter>
    </Card>
  ),
};

export const Empty: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Sin movimientos</CardTitle>
        <CardDescription>Aún no tienes transacciones registradas.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Realiza tu primer depósito para comenzar.</p>
      </CardContent>
    </Card>
  ),
};
