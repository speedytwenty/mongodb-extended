// https://github.com/jsdom/whatwg-url/issues/235
// https://jira.mongodb.org/browse/NODE-3581
const { TextDecoder, TextEncoder } = require('util');

if (global.TextDecoder === undefined) {
  global.TextDecoder = TextDecoder;
}
if (global.TextEncoder === undefined) {
  global.TextEncoder = TextEncoder;
}
