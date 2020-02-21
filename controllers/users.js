exports.show_type = function(req, res, next) {
    res.json({"User type":req.params.type});
  
  };