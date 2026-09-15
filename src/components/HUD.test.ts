import { fireEvent, render, screen } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';
import HUD from './HUD.vue';

describe('HUD', () => {
  it('shows gold, lives, and wave progress', () => {
    render(HUD, { props: { gold: 250, lives: 15, waveNumber: 2, totalWaves: 8, status: 'playing', isEndless: false } });
    expect(screen.getByText('골드: 250')).toBeInTheDocument();
    expect(screen.getByText('라이프: 15')).toBeInTheDocument();
    expect(screen.getByText('웨이브: 2 / 8')).toBeInTheDocument();
  });

  it('emits start-wave when the button is clicked', async () => {
    const { emitted } = render(HUD, {
      props: { gold: 250, lives: 15, waveNumber: 0, totalWaves: 8, status: 'playing', isEndless: false },
    });
    await fireEvent.click(screen.getByRole('button', { name: /웨이브/ }));
    expect(emitted()['start-wave']).toBeTruthy();
  });

  it('disables the start-wave button once the game has ended', () => {
    render(HUD, { props: { gold: 250, lives: 0, waveNumber: 8, totalWaves: 8, status: 'lost', isEndless: false } });
    expect(screen.getByRole('button', { name: /웨이브/ })).toBeDisabled();
  });

  it('shows "N / ??" for wave progress in endless mode instead of the fixed total', () => {
    render(HUD, { props: { gold: 250, lives: 15, waveNumber: 9, totalWaves: 8, status: 'playing', isEndless: true } });
    expect(screen.getByText('웨이브: 9 / ??')).toBeInTheDocument();
  });

  it('emits save and load when their buttons are clicked', async () => {
    const { emitted } = render(HUD, {
      props: { gold: 250, lives: 15, waveNumber: 0, totalWaves: 8, status: 'playing', isEndless: false },
    });
    await fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await fireEvent.click(screen.getByRole('button', { name: '불러오기' }));
    expect(emitted().save).toBeTruthy();
    expect(emitted().load).toBeTruthy();
  });
});
