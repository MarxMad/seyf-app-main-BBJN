import type { Preview, Decorator } from '@storybook/nextjs-vite';
import '../app/globals.css';

/** Toggle the `.dark` class on the preview root to match next-themes strategy. */
const withThemeClass: Decorator = (Story, context) => {
  const theme = context.globals['theme'] as string | undefined;
  const isDark = theme === 'dark';

  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', isDark);
  }

  return <Story />;
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color theme',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withThemeClass],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },
  },
};

export default preview;
