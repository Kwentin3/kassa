import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

  it('scrolls the cart list to the changed item after adding a product', async () => {
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    const rect = (top: number, height: number) =>
      ({
        x: 0,
        y: top,
        top,
        left: 0,
        width: 640,
        height,
        right: 640,
        bottom: top + height,
        toJSON: () => ({})
      }) as DOMRect;

    HTMLElement.prototype.getBoundingClientRect = function getTestRect() {
      const element = this as HTMLElement;
      if (element.classList.contains('bolars-cart-list')) return rect(0, 180);
      if (element.getAttribute('data-cart-line-change') === 'true') return rect(360, 100);
      return originalGetBoundingClientRect.call(this);
    };

    try {
      setRoute('/bolars/self-checkout-mvp');
      const { container } = render(<BolarsSelfCheckoutApp />);

      fireEvent.click(screen.getByRole('button', { name: /Найти товар вручную/i }));
      const addProduct = await screen.findByRole('button', { name: /Добавить товар/i });
      fireEvent.click(addProduct);

      const cartList = await screen.findByLabelText('Список товаров');
      await waitFor(() => expect(cartList.scrollTop).toBeGreaterThan(0));
      expect(container.querySelector('[data-cart-line-change="true"]')).toHaveTextContent(/Клей плиточный БОЛАРС/i);
    } finally {
      HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    }
  });

  it('opens preview controls only with debug preview route', () => {
    setRoute('/bolars/self-checkout-mvp?debug=1&preview=1&scenario=paymentError&theme=bolars-light-magenta-soft');
    const { container } = render(<BolarsSelfCheckoutApp />);

    expect(screen.getByLabelText('Preview controls')).toBeInTheDocument();
    expect(screen.getByLabelText('Preview theme profile')).toHaveValue('bolars-light-magenta-soft');
    expect(screen.getByLabelText('Debug panel')).toBeInTheDocument();
    expect(container.querySelector('.bolars-root')).toHaveClass('bolars-theme-bolars-light-magenta-soft');
    expect((container.querySelector('.bolars-root') as HTMLElement).style.getPropertyValue('--bolars-background')).toBe('#FFFFFF');
    expect((container.querySelector('.bolars-root') as HTMLElement).style.getPropertyValue('--bolars-button-surface')).toBe('#FFE1F0');
    expect(screen.getByText('Оплата не прошла')).toBeInTheDocument();
  });

  it('exposes BolarsSelfCheckout API on debug route', () => {
    setRoute('/bolars/self-checkout-mvp?debug=1&adapter=onec&theme=bolars-light-contrast');
    render(<BolarsSelfCheckoutApp />);

    expect(document.querySelector('.bolars-root')).toHaveClass('bolars-embed-onec');
    expect(window.BolarsSelfCheckout?.getRuntimeInfoJson()).toContain('bolars-self-checkout-mvp');
    expect(window.BolarsSelfCheckout?.getRuntimeInfoJson()).toContain('bolars-light-contrast');
    expect(screen.getByRole('link', { name: '1C handoff' })).toHaveAttribute('href', expect.stringContaining('BOLARS_1C_PROGRAMMER_HANDOFF.md'));
    fireEvent.click(screen.getByRole('button', { name: /Найти товар вручную/i }));
    expect(window.BolarsSelfCheckout?.peekOutboundStatusJson()).toContain('pendingCount');
    expect(window.BolarsSelfCheckout?.drainOutboundCommandsJson()).toContain('startPurchase');
  });

  it('marks the 1C HTML artifact with embedded presentation classes in preview mode', () => {
    setRoute('/bolars/self-checkout-mvp-1c.html?debug=1&preview=1&scenario=cartOneItem');
    const { container } = render(<BolarsSelfCheckoutApp />);

    expect(container.querySelector('.bolars-root')).toHaveClass('bolars-embed-onec');
    expect(container.querySelector('.bolars-root')).toHaveClass('bolars-profile-embeddedOneC');
    expect(container.querySelector('.bolars-primary-action')).not.toHaveClass('sticky');
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

  it('opens touch search keyboard and hides it after candidate selection', async () => {
    setRoute('/bolars/self-checkout-mvp');
    const { container } = render(<BolarsSelfCheckoutApp />);

    fireEvent.click(screen.getByRole('button', { name: /Найти товар вручную/i }));
    const input = await screen.findByLabelText('Поиск товара');
    fireEvent.focus(input);

    const keyboard = screen.getByLabelText('Экранная клавиатура поиска');
    for (const letter of ['к', 'л', 'е', 'й']) {
      fireEvent.click(within(keyboard).getByRole('button', { name: `Ввести ${letter}` }));
    }

    const candidate = await screen.findByRole('button', { name: /Клей плиточный БОЛАРС Стандарт/i });
    fireEvent.click(candidate);

    await waitFor(() => expect(container.querySelectorAll('.bolars-cart-line')).toHaveLength(1));
    expect(screen.queryByLabelText('Экранная клавиатура поиска')).not.toBeInTheDocument();
  });

  it('renders payment review lines without decorative product cards over the name', async () => {
    setRoute('/bolars/self-checkout-mvp');
    const { container } = render(<BolarsSelfCheckoutApp />);

    fireEvent.click(screen.getByRole('button', { name: /Сканировать тестовый товар/i }));
    await screen.findByText('Ваши покупки');
    fireEvent.click(screen.getByRole('button', { name: /Перейти к оплате/i }));
    await screen.findByText('Оплата');

    const reviewPanel = container.querySelector('.bolars-review-panel') as HTMLElement;
    expect(reviewPanel.querySelector('.bolars-product-thumb')).not.toBeInTheDocument();
    expect(within(reviewPanel).getByText(/Клей плиточный БОЛАРС/i)).toBeInTheDocument();
    expect(reviewPanel.querySelector('.bolars-review-line')).toHaveTextContent(/1 шт · 480 ₽/);
  });

  it('removes a review line from payment setup through the shared delete action', async () => {
    setRoute('/bolars/self-checkout-mvp');
    const { container } = render(<BolarsSelfCheckoutApp />);

    fireEvent.click(screen.getByRole('button', { name: /Сканировать тестовый товар/i }));
    await screen.findByText('Ваши покупки');
    fireEvent.click(screen.getByRole('button', { name: /Перейти к оплате/i }));
    await screen.findByText('Оплата');

    const packageButton = container.querySelector('.bolars-package-grid button') as HTMLButtonElement;
    fireEvent.click(packageButton);
    await waitFor(() => expect(container.querySelectorAll('.bolars-review-line')).toHaveLength(2));

    const initialPayable = container.querySelector('.bolars-pay-bottom-amount')?.textContent;
    const packageLine = Array.from(container.querySelectorAll<HTMLElement>('.bolars-review-line')).find((line) => line.textContent?.includes('пакет'));
    expect(packageLine).toBeDefined();
    fireEvent.click(within(packageLine!).getByRole('button', { name: /Удалить строку/i }));

    await waitFor(() => expect(container.querySelectorAll('.bolars-review-line')).toHaveLength(1));
    expect(container.querySelector('.bolars-root')).toHaveClass('bolars-screen-paymentSetup');
    expect(container.querySelector('.bolars-review-panel')).toHaveTextContent(/Клей плиточный БОЛАРС/i);
    expect(Array.from(container.querySelectorAll<HTMLElement>('.bolars-review-line')).some((line) => line.textContent?.includes('пакет'))).toBe(false);
    expect(container.querySelector('.bolars-pay-bottom')).not.toBeDisabled();
    expect(container.querySelector('.bolars-pay-bottom-amount')?.textContent).not.toBe(initialPayable);
  });

  it('shows the payable amount in the payment CTA without a duplicate bottom total band', async () => {
    setRoute('/bolars/self-checkout-mvp?debug=1&preview=1&scenario=paymentSetup');
    const { container } = render(<BolarsSelfCheckoutApp />);

    await waitFor(() => expect(container.querySelector('.bolars-pay-bottom')).toBeInTheDocument());
    const payButton = container.querySelector('.bolars-pay-bottom') as HTMLElement;
    const reviewTotal = container.querySelector('.bolars-review-totals .total b')?.textContent;
    const ctaTotal = payButton.querySelector('.bolars-pay-bottom-amount')?.textContent;
    const normalizeAmount = (value?: string | null) => value?.replace(/\s+/g, ' ').trim();
    const normalizedReviewTotal = normalizeAmount(reviewTotal) ?? '';

    expect(normalizedReviewTotal).not.toBe('');
    expect(container.querySelector('.bolars-final-total-band')).not.toBeInTheDocument();
    expect(normalizeAmount(ctaTotal)).toBe(normalizedReviewTotal);
    expect(normalizeAmount(payButton.textContent)).toContain(normalizedReviewTotal);
    expect(normalizeAmount(payButton.getAttribute('aria-label'))).toContain(normalizedReviewTotal);
  });

  it('opens central phone numpad and applies discount from the numeric draft', async () => {
    setRoute('/bolars/self-checkout-mvp');
    render(<BolarsSelfCheckoutApp />);

    fireEvent.click(screen.getByRole('button', { name: /Сканировать тестовый товар/i }));
    await screen.findByText('Ваши покупки');
    fireEvent.click(screen.getByRole('button', { name: /Перейти к оплате/i }));
    await screen.findByText('Оплата');

    const phoneInput = screen.getByLabelText('Телефон для скидки');
    fireEvent.focus(phoneInput);
    const dialog = screen.getByRole('dialog', { name: 'Цифровая клавиатура телефона' });

    for (const digit of ['9', '0', '0', '1', '2', '3', '4', '5', '6', '7']) {
      fireEvent.click(within(dialog).getByRole('button', { name: `Ввести ${digit}` }));
    }

    expect(phoneInput).toHaveValue('+7 900 123 45 67');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Применить' }));

    await waitFor(() => expect(screen.getByText(/Скидка применена/i)).toBeInTheDocument());
    expect(phoneInput).toHaveValue('+7 900 123 45 67');
    expect(screen.queryByRole('dialog', { name: 'Цифровая клавиатура телефона' })).not.toBeInTheDocument();
  });

  it('sends phone discount command with fixed +7 prefix from local digits', async () => {
    setRoute('/bolars/self-checkout-mvp?debug=1&adapter=onec');
    render(<BolarsSelfCheckoutApp />);

    act(() => {
      window.BolarsSelfCheckout?.receiveStateSnapshot(
        JSON.stringify(createEmptySnapshot('onec', { snapshotVersion: 2, currentScreen: 'paymentSetup', sessionId: 'session-onec-phone' }))
      );
    });

    const phoneInput = await screen.findByLabelText('Телефон для скидки');
    fireEvent.focus(phoneInput);
    const dialog = screen.getByRole('dialog', { name: 'Цифровая клавиатура телефона' });

    for (const digit of ['9', '0', '0', '1', '2', '3', '4', '5', '6', '7']) {
      fireEvent.click(within(dialog).getByRole('button', { name: `Ввести ${digit}` }));
    }

    expect(phoneInput).toHaveValue('+7 900 123 45 67');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Применить' }));

    const outbound = JSON.parse(window.BolarsSelfCheckout?.drainOutboundCommandsJson() ?? '{}');
    expect(outbound.commands).toEqual([
      expect.objectContaining({
        type: 'applyDiscountByPhone',
        payload: { phone: '+7 900 123 45 67' }
      })
    ]);
    expect(screen.queryByRole('dialog', { name: 'Цифровая клавиатура телефона' })).not.toBeInTheDocument();
  });
});
