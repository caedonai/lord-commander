import { render, screen } from '@testing-library/react';
import Home from '../src/app/page';

describe('Home Page', () => {
  it('should render successfully', () => {
    render(<Home />);
    expect(screen.getByText('Welcome marketing 👋')).toBeInTheDocument();
  });

  it('should render the hero section', () => {
    render(<Home />);
    expect(screen.getByText("You're up and running")).toBeInTheDocument();
  });
});