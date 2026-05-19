import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../app/App';

describe('app smoke', () => {
  it('renders idle screen primary action', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /начать покупку/i })).toBeInTheDocument();
    expect(screen.getByText(/касса самообслуживания|добро пожаловать|свежие продукты|городской магазин/i)).toBeInTheDocument();
  });
});
