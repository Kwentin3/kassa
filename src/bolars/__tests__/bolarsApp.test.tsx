import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BolarsSelfCheckoutApp } from '../BolarsSelfCheckoutApp';

const setRoute = (path: string) => {
  window.history.pushState({}, '', path);
};

afterEach(() => {
  window.history.pushState({}, '', '/');
});

describe('BOLARS Self-Checkout App', () => {
  it('renders customer route without debug or adapter switcher', () => {
    setRoute('/bolars/self-checkout-mvp');
    render(<BolarsSelfCheckoutApp />);

    expect(screen.getByText('Поднесите штрих-код товара к сканеру')).toBeInTheDocument();
    expect(screen.queryByLabelText('Debug panel')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Preview controls')).not.toBeInTheDocument();
  });

  it('dispatches user actions and renders cart snapshot', async () => {
    setRoute('/bolars/self-checkout-mvp');
    render(<BolarsSelfCheckoutApp />);

    fireEvent.click(screen.getByRole('button', { name: /Сканировать тестовый товар/i }));
    await waitFor(() => expect(screen.getByText('Ваши покупки')).toBeInTheDocument());
    expect(screen.getByText(/Клей плиточный БОЛАРС/i)).toBeInTheDocument();
  });

  it('opens preview controls only with debug preview route', () => {
    setRoute('/bolars/self-checkout-mvp?debug=1&preview=1&scenario=paymentError');
    render(<BolarsSelfCheckoutApp />);

    expect(screen.getByLabelText('Preview controls')).toBeInTheDocument();
    expect(screen.getByLabelText('Debug panel')).toBeInTheDocument();
    expect(screen.getByText('Оплата не прошла')).toBeInTheDocument();
  });

  it('exposes BolarsSelfCheckout API on debug route', () => {
    setRoute('/bolars/self-checkout-mvp?debug=1&adapter=onec');
    render(<BolarsSelfCheckoutApp />);

    expect(window.BolarsSelfCheckout?.getRuntimeInfoJson()).toContain('bolars-self-checkout-mvp');
    fireEvent.click(screen.getByRole('button', { name: /Начать покупку/i }));
    expect(window.BolarsSelfCheckout?.peekOutboundStatusJson()).toContain('pendingCount');
    expect(window.BolarsSelfCheckout?.drainOutboundCommandsJson()).toContain('startPurchase');
  });
});
