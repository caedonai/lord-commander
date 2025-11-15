import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Home from '../src/app/page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

describe('Home Page', () => {
  it('should render successfully', () => {
    render(<Home />);
    expect(screen.getByText('Welcome to Lord Commander')).toBeInTheDocument();
  });

  it('should render the hero section', () => {
    render(<Home />);
    expect(screen.getByText('The modern CLI SDK framework for building powerful command-line tools')).toBeInTheDocument();
  });

  it('should render the CTA button', () => {
    render(<Home />);
    const buttons = screen.getAllByText('Get Started');
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons[0]).toBeInTheDocument();
  });

  it('should render feature highlights', () => {
    render(<Home />);
    expect(screen.getByText('Type-Safe')).toBeInTheDocument();
    expect(screen.getByText('Modular')).toBeInTheDocument();
    expect(screen.getByText('Fast')).toBeInTheDocument();
  });
});