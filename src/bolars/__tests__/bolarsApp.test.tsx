import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BolarsSelfCheckoutApp } from '../BolarsSelfCheckoutApp';
import { createEmptySnapshot } from '../runtime/defaults';

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

    expect(screen.getByRole('heading', { name: 'Поднесите штрих-код товара к сканеру' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Debug panel')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Preview controls')).not.toBeInTheDocument();
  });

  it('dispatches user actions and renders cart snapshot', async () => {
    setRoute('/bolars/self-checkout-mvp');
    const { container } = render(<BolarsSelfCheckoutApp />);

    fireEvent.click(screen.getByRole('button', { name: /Сканировать тестовый товар/i }));
    await waitFor(() => expect(screen.getByText('Ваши покупки')).toBeInTheDocument());
    expect(screen.getByText(/Клей плиточный БОЛАРС/i)).toBeInTheDocument();
    expect(container.querySelector('.bolars-alert-stack')).not.toBeInTheDocument();
    expect(screen.queryByText('Товар добавлен')).not.toBeInTheDocument();
  });

  it('keeps text scale control in the header and applies it on the start screen', () => {
    setRoute('/bolars/self-checkout-mvp');
    const { container } = render(<BolarsSelfCheckoutApp />);

    expect(container.querySelector('.bolars-start-scale-card')).not.toBeInTheDocument();
    expect(container.querySelector('.bolars-brand-header .bolars-scale-control')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Очень крупный размер текста' }));
    expect(container.querySelector('.bolars-root')).toHaveClass('bolars-scale-extraLarge');
    expect(screen.getByRole('button', { name: 'Очень крупный размер текста' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows an explicit add product action in cart that still dispatches scanCode through runtime', async () => {
    setRoute('/bolars/self-checkout-mvp');
    const { container } = render(<BolarsSelfCheckoutApp />);

    fireEvent.click(screen.getByRole('button', { name: /Найти товар вручную/i }));
    const addProduct = await screen.findByRole('button', { name: /Добавить товар/i });
    fireEvent.click(addProduct);

    await waitFor(() => expect(container.querySelectorAll('.bolars-cart-line')).toHaveLength(1));
  });

  it('uses mock scanner button to add many distinct lines before cycling quantities', async () => {
    setRoute('/bolars/self-checkout-mvp');
    const { container } = render(<BolarsSelfCheckoutApp />);

    fireEvent.click(screen.getByRole('button', { name: /Найти товар вручную/i }));
    const addProduct = await screen.findByRole('button', { name: /Добавить товар/i });

    for (let index = 1; index <= 10; index += 1) {
      fireEvent.click(addProduct);
      await waitFor(() => expect(container.querySelectorAll('.bolars-cart-line')).toHaveLength(index));
    }

    expect(screen.getByText(/Смесь кладочная БОЛАРС/i)).toBeInTheDocument();

    fireEvent.click(addProduct);
    await waitFor(() => expect(container.querySelectorAll('.bolars-cart-line')).toHaveLength(10));
    expect(container.querySelector('.bolars-cart-line .quantity-value')?.textContent).toContain('2 шт');
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
    fireEvent.click(screen.getByRole('button', { name: /Найти товар вручную/i }));
    expect(window.BolarsSelfCheckout?.peekOutboundStatusJson()).toContain('pendingCount');
    expect(window.BolarsSelfCheckout?.drainOutboundCommandsJson()).toContain('startPurchase');
  });

  it('does not enqueue external search commands before configured 4 character threshold', async () => {
    setRoute('/bolars/self-checkout-mvp?debug=1&adapter=onec');
    render(<BolarsSelfCheckoutApp />);

    act(() => {
      window.BolarsSelfCheckout?.receiveStateSnapshot(
        JSON.stringify(createEmptySnapshot('onec', { snapshotVersion: 2, currentScreen: 'cart', sessionId: 'session-onec' }))
      );
    });

    const input = await screen.findByLabelText('Поиск товара');
    fireEvent.change(input, { target: { value: 'кле' } });
    expect(JSON.parse(window.BolarsSelfCheckout?.peekOutboundStatusJson() ?? '{}').pendingCount).toBe(0);
    expect(screen.getByText('Введите минимум 4 символа')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'клей' } });
    expect(JSON.parse(window.BolarsSelfCheckout?.peekOutboundStatusJson() ?? '{}').pendingCount).toBe(1);
    expect(window.BolarsSelfCheckout?.drainOutboundCommandsJson()).toContain('searchProducts');
  });
});
