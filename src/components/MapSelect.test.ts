import { fireEvent, render, screen } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';
import MapSelect from './MapSelect.vue';
import { MAPS } from '../engine/maps';

describe('MapSelect', () => {
  it('lists every map by name under both normal and endless mode', () => {
    render(MapSelect);
    for (const map of MAPS) {
      expect(screen.getByText(map.name)).toBeInTheDocument();
      expect(screen.getByText(`${map.name} (무한)`)).toBeInTheDocument();
    }
  });

  it('emits select with endless=false when a normal-mode map button is clicked', async () => {
    const { emitted } = render(MapSelect);
    await fireEvent.click(screen.getByText(MAPS[0].name));
    expect(emitted().select).toEqual([[MAPS[0].id, false]]);
  });

  it('emits select with endless=true when an endless-mode map button is clicked', async () => {
    const { emitted } = render(MapSelect);
    await fireEvent.click(screen.getByText(`${MAPS[0].name} (무한)`));
    expect(emitted().select).toEqual([[MAPS[0].id, true]]);
  });
});
