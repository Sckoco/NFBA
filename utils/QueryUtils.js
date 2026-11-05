/**
 * Fills the `?` placeholders of a query with its values, for logging only.
 * Never send the result to the database: use placeholders and a values array instead.
 */
function formatString(template, values = []) {
  let i = 0;
  return template.replace(/\?/g, () => {
    const value = values[i++];
    return typeof value === 'string' ? `'${value}'` : String(value);
  });
}

module.exports = formatString;
