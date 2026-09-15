import { render, screen } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';
import App from './App.vue';

describe('App', () => {
  it('renders without crashing', () => {
    render(App);
    expect(screen.getByText('타워 디펜스 로딩 중...')).toBeInTheDocument();
  });
});
