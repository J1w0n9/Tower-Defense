import { fireEvent, render, screen } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';
import App from './App.vue';
import { MAPS } from './engine/maps';

describe('App', () => {
  it('shows the map select screen first', () => {
    render(App);
    expect(screen.getByText(MAPS[0].name)).toBeInTheDocument();
  });

  it('shows the HUD, tower shop, and canvas once a map is selected', async () => {
    render(App);
    await fireEvent.click(screen.getByText(MAPS[0].name));

    expect(screen.getByText(/골드/)).toBeInTheDocument();
    expect(document.querySelector('canvas')).not.toBeNull();
  });
});
