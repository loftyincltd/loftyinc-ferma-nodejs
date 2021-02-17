module.exports= function (config) {
    return function(req,res,next){
        res.header("Access-Control-Allow-Origin","*");
        res.header("Access-Control-Allow-Methods","*");
        res.header("Access-Control-Allow-Headers","X-Requested-With,Authorization,encrypted,Content-Type,limit,skip,count,username,password,company,first,last,order,user");
        // res.header('Access-Control-Allow-Credentials', true);

        next();

    }
}