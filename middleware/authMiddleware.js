module.exports = {
  isAuthenticated: (req, res, next) => {
    if (req.session && req.session.user) {
      return next();
    }
    req.flash('error_msg', 'Please log in to access this page.');
    res.redirect('/login');
  },

  hasRole: (...roles) => {
    return (req, res, next) => {
      if (!req.session || !req.session.user) {
        req.flash('error_msg', 'Please log in to continue.');
        return res.redirect('/login');
      }

      if (roles.includes(req.session.user.role)) {
        return next();
      }

      req.flash('error_msg', 'Unauthorized access! You do not have permission to view this resource.');
      
      // Redirect to user's home dashboard based on role
      const role = req.session.user.role;
      if (role === 'admin') return res.redirect('/admin/dashboard');
      if (role === 'agent') return res.redirect('/agent/dashboard');
      return res.redirect('/citizen/dashboard');
    };
  },

  redirectIfAuthenticated: (req, res, next) => {
    if (req.session && req.session.user) {
      const role = req.session.user.role;
      if (role === 'admin') return res.redirect('/admin/dashboard');
      if (role === 'agent') return res.redirect('/agent/dashboard');
      return res.redirect('/citizen/dashboard');
    }
    next();
  }
};
