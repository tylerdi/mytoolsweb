self.onmessage = ({ data }) => {
  try {
    const { pattern, flags, sample } = data;
    if (!/^[dgimsuvy]*$/.test(flags) || new Set(flags).size !== flags.length) {
      throw new Error('标志位只支持 JavaScript 正则标志，且不能重复');
    }
    const searchFlags = flags.includes('g') ? flags : `${flags}g`;
    const expression = new RegExp(pattern, searchFlags);
    const matches = [];
    for (const match of sample.matchAll(expression)) {
      matches.push(`位置 ${match.index}: ${JSON.stringify(match[0])}`);
      if (matches.length === 100) break;
    }
    self.postMessage({ result: matches.length ? `找到 ${matches.length}${matches.length === 100 ? '+' : ''} 个匹配\n${matches.join('\n')}` : '没有匹配' });
  } catch (error) {
    self.postMessage({ error: error.message || '正则表达式无效' });
  }
};
