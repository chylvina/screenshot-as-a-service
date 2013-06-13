var fs = require('fs');
fs.writeSync("./test", "Hey there!", function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("The file was saved!");
    }
}); 

// console.log(fs.writeFileSync("./test", "Hey there!")); 