import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../components/Sidebar';

describe('Sidebar', () => {
  const defaultProps = {
    currentView: 'dashboard' as const,
    onViewChange: vi.fn(),
    expanded: true,
    onToggle: vi.fn(),
  };

  it('renders the Valtheron logo text when expanded', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Valtheron')).toBeInTheDocument();
  });

  it('hides logo text when collapsed', () => {
    render(<Sidebar {...defaultProps} expanded={false} />);
    expect(screen.queryByText('Valtheron')).not.toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Agenten')).toBeInTheDocument();
    expect(screen.getByText('Sicherheit')).toBeInTheDocument();
    expect(screen.getByText('Kanban Board')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Kill-Switch')).toBeInTheDocument();
    expect(screen.getByText('Workflows')).toBeInTheDocument();
    expect(screen.getByText('LLM Provider')).toBeInTheDocument();
  });

  it('highlights the active view', () => {
    render(<Sidebar {...defaultProps} currentView="agents" />);

    const agentsButton = screen.getByTitle('Agenten');
    expect(agentsButton.className).toContain('active');

    const dashboardButton = screen.getByTitle('Dashboard');
    expect(dashboardButton.className).not.toContain('active');
  });

  it('calls onViewChange when a nav item is clicked', () => {
    const onViewChange = vi.fn();
    render(<Sidebar {...defaultProps} onViewChange={onViewChange} />);

    fireEvent.click(screen.getByText('Agenten'));
    expect(onViewChange).toHaveBeenCalledWith('agents');

    fireEvent.click(screen.getByText('Sicherheit'));
    expect(onViewChange).toHaveBeenCalledWith('security');
  });

  it('calls onToggle when logo is clicked', () => {
    const onToggle = vi.fn();
    render(<Sidebar {...defaultProps} onToggle={onToggle} />);

    fireEvent.click(screen.getByText('V'));
    expect(onToggle).toHaveBeenCalled();
  });

  it('shows search button', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Suche (Ctrl+K)')).toBeInTheDocument();
  });
});
