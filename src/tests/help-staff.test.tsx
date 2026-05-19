import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HelpStaffScreen } from '../screens/HelpStaffScreen';
import { useTerminalStore } from '../state/store';

describe('help and staff screen', () => {
  afterEach(() => {
    cleanup();
    useTerminalStore.getState().resetSession();
  });

  it('does not expose buyer resume action for receipt errors', () => {
    useTerminalStore.setState({ state: { name: 'help_requested', source: 'Ошибка чека' } });
    render(<HelpStaffScreen />);
    expect(screen.queryByRole('button', { name: /вернуться к покупке/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  it('allows buyer resume for ordinary help requests', () => {
    useTerminalStore.setState({ state: { name: 'help_requested', source: 'Кнопка помощи' } });
    render(<HelpStaffScreen />);
    expect(screen.getByRole('button', { name: /вернуться к покупке/i })).toBeInTheDocument();
  });
});
