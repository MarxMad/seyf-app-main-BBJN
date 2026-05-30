import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { NotificationSettingsCard } from './notification-settings-card';

const meta: Meta<typeof NotificationSettingsCard> = {
  title: 'App/NotificationSettingsCard',
  component: NotificationSettingsCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};
export default meta;

type Story = StoryObj<typeof NotificationSettingsCard>;

/** Loaded state — fetch returns a phone number with SMS enabled. */
export const Default: Story = {
  parameters: {
    mockData: [
      {
        url: '/api/seyf/notification-settings',
        method: 'GET',
        status: 200,
        response: {
          userId: 'mock-user',
          settings: { phoneNumber: '5512345678', smsEnabled: true, updatedAt: new Date().toISOString() },
        },
      },
    ],
  },
  beforeEach() {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          userId: 'mock-user',
          settings: { phoneNumber: '5512345678', smsEnabled: true, updatedAt: new Date().toISOString() },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
  },
};

/** Error state — fetch fails to load settings. */
export const LoadError: Story = {
  beforeEach() {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: 'No se pudo cargar tu preferencia de notificaciones.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
  },
};
