var tool = require('url');

var s = tool.parse('www.baidu.com/sdfsdfsf?url=http://sdflkjsdf.com');

console.log(s.hostname);
console.log(s.path);
console.log(tool.format(s));