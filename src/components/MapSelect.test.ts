import { fireEvent, render, screen } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';
import MapSelect from './MapSelect.vue';
import { MAPS } from '../engine/maps';

describe('MapSelect', () => {
  it('lists every map by name', () => {
    render(MapSelect);
    for (const map of MAPS) {
      expect(screen.getByText(map.name)).toBeInTheDocument();
    }
  });

  it('emits select with the map id when a map button is clicked', async () => {
    const { emitted } = render(MapSelect);
    await fireEvent.click(screen.getByText(MAPS[0].name));
    expect(emitted().select).toEqual([[MAPS[0].id]]);
  });
});
