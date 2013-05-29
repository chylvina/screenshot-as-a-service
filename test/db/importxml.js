var fs = require('fs'),
    xml2js = require('xml2js'),
    db = require("mongojs").connect('mongodb://localhost/mynetrnd', ["sites"]);

return; // !! xml已经导入，除非已经备份，否则不要再次导入。

var parser = new xml2js.Parser();
fs.readFile(__dirname + '/顶级域名20130528.xml', function(err, data) {
  parser.parseString(data, function (err, result) {
    //console.dir(result);
    console.log('Done');

    for(var a=0; a < result.Workbook.Worksheet.length; a++) {
      for(var b=0; b < result.Workbook.Worksheet[a].Table.length; b++) {
        for(var c=0; c < result.Workbook.Worksheet[a].Table[b].Row.length; c++) {
          var s = result.Workbook.Worksheet[a].Table[b].Row[c].Cell[0].Data[0]._;
          if(!s || (typeof s != 'string') || s == '' || s.length < 4) {
            console.log('------------------');
            console.log('域名' + s + '不符合规范，未录入数据库.');
            console.log('Worksheet:' + a);
            console.log('Table:' + b);
            console.log('Row:' + c);
            continue;
          }

          db.sites.save({domain1: result.Workbook.Worksheet[a].Table[b].Row[c].Cell[0].Data[0]._}, function(err, saved) {
              if(err) {
                console.log('------------------');
                console.log('域名' + s + '录入数据库失败.');
                console.log('Worksheet:' + a);
                console.log('Table:' + b);
                console.log('Row:' + c);
                continue;
              }
          });
        }
      }
    }
  });
});
