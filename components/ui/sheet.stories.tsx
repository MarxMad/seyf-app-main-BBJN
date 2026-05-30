import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from './sheet';
import { Button } from './button';

const meta: Meta = {
  title: 'UI/Sheet',
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Abrir panel</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Detalle de movimiento</SheetTitle>
          <SheetDescription>Información completa de la transacción.</SheetDescription>
        </SheetHeader>
        <div className="p-4 text-sm text-muted-foreground">Contenido del panel aquí.</div>
        <SheetFooter>
          <Button className="w-full">Cerrar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const BottomSheet: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Panel inferior</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Opciones</SheetTitle>
        </SheetHeader>
        <div className="p-4 text-sm text-muted-foreground">Contenido del panel inferior.</div>
      </SheetContent>
    </Sheet>
  ),
};
