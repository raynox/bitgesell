// Suppress ReactDOMTestUtils.act deprecation warning in test output
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('ReactDOMTestUtils.act')
  ) {
    return;
  }
  originalError(...args);
}; 