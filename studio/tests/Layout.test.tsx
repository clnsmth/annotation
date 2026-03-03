import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Layout } from '../src/components/Layout';
import React from 'react';

describe('Layout', () => {
  it('renders the header and children correctly', () => {
    render(
      <Layout step="UPLOAD">
        <div data-testid="test-child">Test Content</div>
      </Layout>
    );

    // Check if the title is present
    expect(screen.getByText('EML Annotation Studio')).toBeInTheDocument();
    expect(screen.getByText('Powered by AI')).toBeInTheDocument();

    // Check if children are rendered
    expect(screen.getByTestId('test-child')).toHaveTextContent('Test Content');

    // Check if step indicators are present
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Annotate')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });
});
