import { fireEvent, render, screen } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';
import TowerInspector from './TowerInspector.vue';

describe('TowerInspector', () => {
  it('shows the tower name, level, and upgrade cost', () => {
    render(TowerInspector, {
      props: { tower: { name: '스카웃', level: 1, upgradeCost: 30, canUpgrade: true, sellRefund: 20 } },
    });
    expect(screen.getByText('스카웃 (Lv.1)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /업그레이드/ })).toHaveTextContent('30G');
  });

  it('disables the upgrade button once the tower is at max level', () => {
    render(TowerInspector, {
      props: { tower: { name: '스카웃', level: 3, upgradeCost: 0, canUpgrade: false, sellRefund: 20 } },
    });
    expect(screen.getByRole('button', { name: /업그레이드/ })).toBeDisabled();
  });

  it('shows the sell refund amount', () => {
    render(TowerInspector, {
      props: { tower: { name: '스카웃', level: 1, upgradeCost: 30, canUpgrade: true, sellRefund: 20 } },
    });
    expect(screen.getByRole('button', { name: /판매/ })).toHaveTextContent('20G');
  });

  it('emits upgrade, sell, and close', async () => {
    const { emitted } = render(TowerInspector, {
      props: { tower: { name: '스카웃', level: 1, upgradeCost: 30, canUpgrade: true, sellRefund: 20 } },
    });
    await fireEvent.click(screen.getByRole('button', { name: /업그레이드/ }));
    await fireEvent.click(screen.getByRole('button', { name: /판매/ }));
    await fireEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(emitted().upgrade).toBeTruthy();
    expect(emitted().sell).toBeTruthy();
    expect(emitted().close).toBeTruthy();
  });
});
