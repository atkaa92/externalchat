module.exports = {
	ensureAuthenticaed : function(req, res, next){
		if (req.isAuthenticated()) {
			return next()
		}else{
			req.flash('error_msg', 'Not Autherized')
			res.redirect('/users/login')
		}
	}
}