describe('aria-current-unique-in-set', () => {
  const { html, checkSetup, MockCheckContext, getCheckEvaluate } =
    axe.testUtils;
  const checkContext = new MockCheckContext();
  const checkEvaluate = getCheckEvaluate('aria-current-unique-in-set');

  afterEach(() => {
    checkContext.reset();
  });

  it('returns false when no other element in the set is current', () => {
    const params = checkSetup(html`
      <ul>
        <li><a id="target" href="/a" aria-current="page">A</a></li>
        <li><a href="/b">B</a></li>
        <li><a href="/c" aria-current="false">C</a></li>
      </ul>
    `);
    assert.isFalse(checkEvaluate.apply(checkContext, params));
    assert.deepEqual(checkContext._relatedNodes, []);
    assert.deepEqual(checkContext._data, { role: 'list', token: 'page' });
  });

  it('returns true when another link in the list is current with a different name and href', () => {
    const params = checkSetup(html`
      <ul>
        <li><a id="target" href="/a" aria-current="page">A</a></li>
        <li><a id="other" href="/b" aria-current="page">B</a></li>
      </ul>
    `);
    assert.isTrue(checkEvaluate.apply(checkContext, params));
    assert.deepEqual(checkContext._relatedNodes, [
      document.querySelector('#other')
    ]);
  });

  it('returns true for rows of links that differ only in the query', () => {
    const params = checkSetup(html`
      <table>
        <tr>
          <td><a id="target" href="?edit=1" aria-current="page">Ann</a></td>
        </tr>
        <tr>
          <td><a href="?edit=2" aria-current="page">Bob</a></td>
        </tr>
      </table>
    `);
    assert.isTrue(checkEvaluate.apply(checkContext, params));
    assert.equal(checkContext._data.role, 'table');
  });

  it('returns true for the same name and a different href', () => {
    const params = checkSetup(html`
      <ul>
        <li><a id="target" href="?edit=1" aria-current="page">Edit</a></li>
        <li><a href="?edit=2" aria-current="page">Edit</a></li>
      </ul>
    `);
    assert.isTrue(checkEvaluate.apply(checkContext, params));
  });

  it('returns true for the same href and a different name', () => {
    const params = checkSetup(html`
      <ul>
        <li><a id="target" href="/a" aria-current="page">A</a></li>
        <li><a href="/a" aria-current="page">Also A</a></li>
      </ul>
    `);
    assert.isTrue(checkEvaluate.apply(checkContext, params));
  });

  it('returns false for duplicates with the same name and href', () => {
    const params = checkSetup(html`
      <ul>
        <li><a id="target" href="/a" aria-current="page">A</a></li>
        <li><a href="/a" aria-current="page"> a </a></li>
      </ul>
    `);
    assert.isFalse(checkEvaluate.apply(checkContext, params));
  });

  it('compares resolved hrefs', () => {
    const params = checkSetup(html`
      <ul>
        <li><a id="target" href="a" aria-current="page">A</a></li>
        <li><a href="./a" aria-current="page">A</a></li>
      </ul>
    `);
    assert.isFalse(checkEvaluate.apply(checkContext, params));
  });

  it('returns true for buttons with different names', () => {
    const params = checkSetup(html`
      <div role="toolbar">
        <button id="target" aria-current="true">Bold</button>
        <button aria-current="true">Italic</button>
      </div>
    `);
    assert.isTrue(checkEvaluate.apply(checkContext, params));
    assert.equal(checkContext._data.role, 'toolbar');
  });

  it('ignores current elements in a different set', () => {
    const params = checkSetup(html`
      <nav>
        <a id="target" href="/a" aria-current="page">A</a>
      </nav>
      <nav>
        <a href="/b" aria-current="page">B</a>
      </nav>
    `);
    assert.isFalse(checkEvaluate.apply(checkContext, params));
  });

  it('uses the nearest set, so a parent and a nested item are not compared', () => {
    const params = checkSetup(html`
      <ul>
        <li>
          <a id="target" href="/docs" aria-current="true">Docs</a>
          <ul>
            <li><a href="/docs/intro" aria-current="page">Intro</a></li>
          </ul>
        </li>
      </ul>
    `);
    assert.isFalse(checkEvaluate.apply(checkContext, params));
  });

  it('treats the cells of a table as one set', () => {
    const params = checkSetup(html`
      <table role="grid">
        <tr>
          <td id="target" aria-current="date">1</td>
          <td>2</td>
        </tr>
        <tr>
          <td aria-current="date">8</td>
          <td>9</td>
        </tr>
      </table>
    `);
    assert.isTrue(checkEvaluate.apply(checkContext, params));
    assert.equal(checkContext._data.role, 'grid');
  });

  it('ignores elements with a different token', () => {
    const params = checkSetup(html`
      <ol>
        <li><a id="target" href="/a" aria-current="page">A</a></li>
        <li><a href="/b" aria-current="step">B</a></li>
        <li><a href="/c" aria-current="location">C</a></li>
      </ol>
    `);
    assert.isFalse(checkEvaluate.apply(checkContext, params));
  });

  it('compares any token with the anyToken option', () => {
    const params = checkSetup(
      html`
        <ol>
          <li><a id="target" href="/a" aria-current="page">A</a></li>
          <li><a href="/b" aria-current="step">B</a></li>
        </ol>
      `,
      { anyToken: true }
    );
    assert.isTrue(checkEvaluate.apply(checkContext, params));
  });

  it('matches tokens case-insensitively and treats unknown values as "true"', () => {
    const params = checkSetup(html`
      <ul>
        <li><a id="target" href="/a" aria-current="yes">A</a></li>
        <li><a href="/b" aria-current=" TRUE ">B</a></li>
      </ul>
    `);
    assert.isTrue(checkEvaluate.apply(checkContext, params));
    assert.equal(checkContext._data.token, 'true');
  });

  it('treats elements outside any set as one set', () => {
    const params = checkSetup(html`
      <div>
        <a id="target" href="/a" aria-current="page">A</a>
        <a href="/b" aria-current="page">B</a>
      </div>
    `);
    assert.isTrue(checkEvaluate.apply(checkContext, params));
    assert.equal(checkContext._data.role, 'page');
  });

  it('skips a presentational list for the enclosing set', () => {
    const params = checkSetup(html`
      <nav>
        <ul role="none">
          <li role="none">
            <a id="target" href="/a" aria-current="page">A</a>
          </li>
          <li role="none"><a href="/b" aria-current="page">B</a></li>
        </ul>
      </nav>
    `);
    assert.isTrue(checkEvaluate.apply(checkContext, params));
    assert.equal(checkContext._data.role, 'navigation');
  });

  it('ignores elements hidden from screen readers', () => {
    const params = checkSetup(html`
      <ul>
        <li><a id="target" href="/a" aria-current="page">A</a></li>
        <li><a href="/b" aria-current="page" style="display:none">B</a></li>
        <li aria-hidden="true">
          <a href="/c" aria-current="page" tabindex="-1">C</a>
        </li>
      </ul>
    `);
    assert.isFalse(checkEvaluate.apply(checkContext, params));
  });

  describe('Shadow DOM', () => {
    it('finds a set inside a shadow root', () => {
      const params = checkSetup(html`
        <div>
          <template shadowrootmode="open">
            <ul>
              <li><a id="target" href="/a" aria-current="page">A</a></li>
              <li><a href="/b" aria-current="page">B</a></li>
            </ul>
          </template>
        </div>
      `);
      assert.isTrue(checkEvaluate.apply(checkContext, params));
      assert.lengthOf(checkContext._relatedNodes, 1);
    });

    it('finds a set across the shadow boundary', () => {
      const params = checkSetup(html`
        <nav>
          <a href="/b" aria-current="page">B</a>
          <div>
            <template shadowrootmode="open">
              <a id="target" href="/a" aria-current="page">A</a>
            </template>
          </div>
        </nav>
      `);
      assert.isTrue(checkEvaluate.apply(checkContext, params));
      assert.equal(checkContext._data.role, 'navigation');
    });

    it('finds the set of slotted elements', () => {
      const params = checkSetup(html`
        <div>
          <template shadowrootmode="open">
            <ul>
              <slot></slot>
            </ul>
          </template>
          <li><a id="target" href="/a" aria-current="page">A</a></li>
          <li><a href="/b" aria-current="page">B</a></li>
        </div>
      `);
      assert.isTrue(checkEvaluate.apply(checkContext, params));
      assert.equal(checkContext._data.role, 'list');
    });

    it('does not compare elements in sets in different shadow roots', () => {
      const params = checkSetup(html`
        <div>
          <template shadowrootmode="open">
            <nav><a id="target" href="/a" aria-current="page">A</a></nav>
          </template>
        </div>
        <div>
          <template shadowrootmode="open">
            <nav><a href="/b" aria-current="page">B</a></nav>
          </template>
        </div>
      `);
      assert.isFalse(checkEvaluate.apply(checkContext, params));
    });
  });
});
