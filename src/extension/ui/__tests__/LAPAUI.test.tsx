/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { LAPAActionBar } from '../LAPAActionBar';

describe('LAPA UI Components', () => {
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container) {
      document.body.removeChild(container);
      container = null;
    }
  });

  it('renders LAPAActionBar without crashing', () => {
    act(() => {
      ReactDOM.render(<LAPAActionBar />, container);
    });

    expect(container?.querySelector('.lapa-action-bar')).toBeInTheDocument();
  });

  it('renders start button in LAPAActionBar', () => {
    act(() => {
      ReactDOM.render(<LAPAActionBar />, container);
    });

    const startButton = container?.querySelector('button');
    expect(startButton).toBeInTheDocument();
    expect(startButton?.textContent).toBe('Start Swarm');
  });
});