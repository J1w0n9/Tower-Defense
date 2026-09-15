import { fireEvent, render, screen } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';
import TowerShop from './TowerShop.vue';
import { TOWER_LIST } from '../engine/towers';

describe('TowerShop', () => {
  it('lists every tower with its cost', () => {
    render(TowerShop, { props: { selectedTowerId: null, gold: 1000 } });
    for (const tower of TOWER_LIST) {
      expect(screen.getByText(new RegExp(tower.name))).toBeInTheDocument();
    }
  });

  it('emits select with the tower id when a tower button is clicked', async () => {
    const { emitted } = render(TowerShop, { props: { selectedTowerId: null, gold: 1000 } });
    await fireEvent.click(screen.getByText(new RegExp(TOWER_LIST[0].name)));
    expect(emitted().select).toEqual([[TOWER_LIST[0].id]]);
  });

  it('disables towers the player cannot afford', () => {
    const expensive = TOWER_LIST.find((t) => t.cost > 10)!;
    render(TowerShop, { props: { selectedTowerId: null, gold: 10 } });
    expect(screen.getByText(new RegExp(expensive.name)).closest('button')).toBeDisabled();
  });
});
