import { render } from 'brisa/test';
import { describe, expect, it } from 'bun:test';
import Home from '.';

describe('Index', () => {
  it('should render the game heading', async () => {
    const { container } = await render(<Home />);

    expect(container).toContainTextContent('Square root guessing game');
    expect(container).toContainTextContent('Assignment 11 · Brisa port');
  });
});
