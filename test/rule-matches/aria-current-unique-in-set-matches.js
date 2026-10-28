describe('aria-current-unique-in-set-matches', () => {
  const { fixtureSetup } = axe.testUtils;
  let rule;

  beforeEach(() => {
    rule = axe.utils.getRule('aria-current-unique-in-set');
  });

  function matches(value) {
    fixtureSetup(`<a id="target" href="/" aria-current="${value}">A</a>`);
    const vNode = axe.utils.querySelectorAll(axe._tree[0], '#target')[0];
    return rule.matches(vNode.actualNode, vNode);
  }

  it('matches every current token', () => {
    for (const value of ['page', 'step', 'location', 'date', 'time', 'true']) {
      assert.isTrue(matches(value), value);
    }
  });

  it('matches unknown values, which mean "true"', () => {
    assert.isTrue(matches('yes'));
  });

  it('matches case-insensitively and ignores whitespace', () => {
    assert.isTrue(matches(' PAGE '));
  });

  it('does not match "false" or an empty value', () => {
    assert.isFalse(matches('false'));
    assert.isFalse(matches(' FALSE '));
    assert.isFalse(matches(''));
    assert.isFalse(matches('  '));
  });
});
