import { render } from 'brisa/test';
import { describe, expect, it } from 'bun:test';
import Home from '.';

describe('Index', () => {
  it('should render the pizza heading', async () => {
    const { container } = await render(<Home />);

    expect(container).toContainTextContent('Hannah, Ted & Madi’s Super Swaggy Pizza');
    expect(container).toContainTextContent('Assignment 5 · Brisa port');
  });
});
