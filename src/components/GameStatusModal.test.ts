import { fireEvent, render, screen } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';
import GameStatusModal from './GameStatusModal.vue';

describe('GameStatusModal', () => {
  it('shows a victory message when status is won', () => {
    render(GameStatusModal, { props: { status: 'won' } });
    expect(screen.getByText(/승리/)).toBeInTheDocument();
  });

  it('shows a game-over message when status is lost', () => {
    render(GameStatusModal, { props: { status: 'lost' } });
    expect(screen.getByText(/패배|게임\s*오버/)).toBeInTheDocument();
  });

  it('emits restart when the button is clicked', async () => {
    const { emitted } = render(GameStatusModal, { props: { status: 'won' } });
    await fireEvent.click(screen.getByRole('button'));
    expect(emitted().restart).toBeTruthy();
  });
});
