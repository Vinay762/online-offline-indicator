const KEY_NAMESPACE = 'presence';

const presenceKey = (userId) => {
  if (!userId) {
    throw new Error('presenceKey requires a userId');
  }
  return `${KEY_NAMESPACE}:{${userId}}`;
};

module.exports = {
  presenceKey,
  KEY_NAMESPACE
};
