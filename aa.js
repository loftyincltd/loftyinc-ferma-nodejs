 
var fs = require('fs');

let a ={};
let cur = '';
olddesctrict.forEach((elt)=>{
  if(elt.STATE && elt.STATE.trim()!==""){
      cur = elt.STATE;
  }

 if(elt['SENATORIAL DISTRICTS'] &&elt['SENATORIAL DISTRICTS'].trim()!==""){
    if(a[cur]){
        a[cur].push(elt['SENATORIAL DISTRICTS']);
    }else{
        a[cur]=[elt['SENATORIAL DISTRICTS']]
    }
 }

})
fs.writeFile('dist.json', JSON.stringify(a), 'utf8', function(err, resp){
    console.log(err, resp)
});