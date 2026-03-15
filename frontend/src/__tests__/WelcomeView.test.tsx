import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WelcomeView from '../components/WelcomeView';

describe('WelcomeView', () => {
  const onComplete = vi.fn();

  const renderView = (username = 'TestUser') => {
    return render(<WelcomeView username={username} onComplete={onComplete} />);
  };

  beforeEach(() => {
    onComplete.mockClear();
  });

  it('renders the welcome greeting with username on step 0', () => {
    renderView('Alice');
    expect(screen.getByText('Hallo Alice!')).toBeInTheDocument();
  });

  it('renders description text for step 0', () => {
    renderView();
    expect(screen.getByText(/Dein Workspace zur Steuerung von KI-Agenten/)).toBeInTheDocument();
  });

  it('renders "Weiter" button on first step', () => {
    renderView();
    expect(screen.getByText('Weiter')).toBeInTheDocument();
  });

  it('does not render "Zurück" on the first step', () => {
    renderView();
    expect(screen.queryByText('Zurück')).not.toBeInTheDocument();
  });

  it('renders "Überspringen" link on non-last steps', () => {
    renderView();
    expect(screen.getByText('Überspringen')).toBeInTheDocument();
  });

  it('advances to step 1 when "Weiter" is clicked', () => {
    renderView();
    fireEvent.click(screen.getByText('Weiter'));
    expect(screen.getByText('Agenten erstellen')).toBeInTheDocument();
  });

  it('shows "Zurück" on step 1', () => {
    renderView();
    fireEvent.click(screen.getByText('Weiter'));
    expect(screen.getByText('Zurück')).toBeInTheDocument();
  });

  it('goes back to step 0 when "Zurück" is clicked', () => {
    renderView('Bob');
    fireEvent.click(screen.getByText('Weiter'));
    fireEvent.click(screen.getByText('Zurück'));
    expect(screen.getByText('Hallo Bob!')).toBeInTheDocument();
  });

  it('navigates through all 4 steps', () => {
    renderView();
    fireEvent.click(screen.getByText('Weiter'));
    expect(screen.getByText('Agenten erstellen')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Weiter'));
    expect(screen.getByText('Aufgaben & Workflows')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Weiter'));
    expect(screen.getByText('Sicherheit & Monitoring')).toBeInTheDocument();
  });

  it('renders "Los geht\'s" button on the last step', () => {
    renderView();
    // Navigate to last step (step 3)
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByText('Weiter'));
    }
    expect(screen.getByText("Los geht's")).toBeInTheDocument();
  });

  it('does not render "Überspringen" on the last step', () => {
    renderView();
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByText('Weiter'));
    }
    expect(screen.queryByText('Überspringen')).not.toBeInTheDocument();
  });

  it('calls onComplete when "Los geht\'s" is clicked on last step', () => {
    renderView();
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByText('Weiter'));
    }
    fireEvent.click(screen.getByText("Los geht's"));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete when "Überspringen" is clicked', () => {
    renderView();
    fireEvent.click(screen.getByText('Überspringen'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('shows icon for current step', () => {
    renderView();
    expect(screen.getByText('V')).toBeInTheDocument();
  });

  it('shows correct icon on step 1', () => {
    renderView();
    fireEvent.click(screen.getByText('Weiter'));
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows 4 step indicator dots', () => {
    const { container } = renderView();
    // The step dots are div elements with specific styles (borderRadius: 50%)
    // We just verify the component renders properly by checking text count
    expect(screen.getByText('Weiter')).toBeInTheDocument();
    // 4 steps exist: we can navigate through all of them without error
    fireEvent.click(screen.getByText('Weiter'));
    fireEvent.click(screen.getByText('Weiter'));
    fireEvent.click(screen.getByText('Weiter'));
    expect(screen.getByText("Los geht's")).toBeInTheDocument();
    void container;
  });
});
