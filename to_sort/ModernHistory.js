(() => {
  const NAME = 'ModernHistory';
  const VERSION = '0.1.0';
  const R = window.history.length - 1;
  const isRefresh = (window.history.state != null);
  const timeLine = [];
  let pos = 0;

  const mh = {
    pos, dir: 0, state: {}, stateLabel: '', timeLine, debug: false, R, isRefresh, addState
  };
  window[NAME] = mh;
  // Although we aren't doing DOM manipulation, we want to wait for application code to register listeners.
  window.addEventListener('load', init);

  function init() {
    let initialState;

    if (isRefresh) {
      initialState = window.history.state;
      pos = initialState.id;

      // Grab all the accessible states, traversing the linked list
      // Note: nextState is truncated.
      let state = initialState;
      while (state.prevState) {
        state = state.prevState;
      }
      while (state.nextState) {
        timeLine.push(state);
        state = state.nextState;
      }
      timeLine.push(state);
    } else { // Not a refresh, so start fresh
      pos = 0;
      initialState = {id: 0, label: 'start', timestamp: Date.now(), isHash: false, detail: null};
      // The browser always adds a state, which we replace.
      window.history.replaceState(initialState, null, null);
      timeLine.push(initialState);
    }
    setPos(pos);
    window.addEventListener('popstate', popState);

    if (mh.debug) console.debug('init()', NAME, VERSION, 'isRefresh', isRefresh, mh);
  }

  function setPos(i) {
    pos = i;
    mh.pos = i;
    mh.state = timeLine[i];
    mh.stateLabel = timeLine[i].label;
  }

  // Wrapper function for pushState; normalizes pushState and hashchange.
  function addState(label, detail = null, isHash = false) {
    let prevState = timeLine[pos];
    // Skip state transitions to the same label
    if (label === prevState.label) {
      if (mh.debug) console.debug('addState()', 'duplicate label detected, skipping', label);
      return;
    }

    // Handle the case of adding events in the past, which deletes the remaining timeline
    if (pos < timeLine.length - 1) {
      timeLine.splice(pos + 1, timeLine.length - 1);
    }

    // Construct a state, add it to our timeLine, add to window.history, and increment the position.
    let state = {
      id: timeLine.length,
      label,
      timestamp: Date.now(),
      isHash,
      detail
    };
    // Form a doubly-linked list between states, to support browser refresh
    state.prevState = prevState;
    prevState.nextState = state;

    if (isHash) {
      window.history.replaceState(state, null, '#' + label);
    } else {
      window.history.pushState(state, null, '#' + label);
    }

    timeLine.push(state);
    setPos(pos + 1);
    window.dispatchEvent(new Event('ModernHistory.add'));
    if (mh.debug) console.debug('addState()', mh);
  }


  // Use onpopstate to detect forward, back, and hashchange.
  function popState(e) {
    //it's a hash change.
    if (!e.state) {
      let label = window.location.hash.substr(1); //strip the hash
      addState(label, null, true);
      return;
    }
    let index = e.state.id;
    // It's a state we haven't seen before, so record it.
    let recoverState = false;
    if (index > timeLine.length - 1) {
      if (mh.debug) console.debug('popState()', 'future history detected!', e.state);
      timeLine[pos].nextState = e.state;
      e.state.prevState = timeLine[pos];
      timeLine.push(e.state);
      recoverState = true;
    }
    let dir = 0;
    if (index > pos) {
      dir = 1;
      dirString = 'forward';
    } else if (index < pos) {
      dir = -1;
      dirString = 'back'
    }
    mh.dir = dir;
    setPos(index);
    window.dispatchEvent(new Event('ModernHistory.move'));
    window.dispatchEvent(new Event('ModernHistory.' + dirString));
    if (recoverState)
      window.dispatchEvent(new Event('ModernHistory.recoverState'));

    if (mh.debug) console.debug('popState()', mh);
  }

})();
