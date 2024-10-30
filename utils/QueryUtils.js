function formatString(template, ...values) {
  return template.replace(/\?/g, () => values.shift());
}

module.exports = formatString;