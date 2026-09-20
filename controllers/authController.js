const User = require('../models/User');

exports.getLogin = (req, res) => {
  res.render('auth/login', { title: 'Login — EcoLoop' });
};

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      req.flash('error_msg', 'Please provide both email and password.');
      return res.redirect('/login');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      req.flash('error_msg', 'Invalid credentials. User not found.');
      return res.redirect('/login');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error_msg', 'Invalid credentials. Password incorrect.');
      return res.redirect('/login');
    }

    // Set session user
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address
    };

    req.flash('success_msg', `Welcome back to EcoLoop, ${user.name}!`);

    if (user.role === 'admin') return res.redirect('/admin/dashboard');
    if (user.role === 'agent') return res.redirect('/agent/dashboard');
    return res.redirect('/citizen/dashboard');
  } catch (error) {
    console.error('Login Error:', error);
    req.flash('error_msg', 'An error occurred during login. Please try again.');
    res.redirect('/login');
  }
};

exports.getRegister = (req, res) => {
  res.render('auth/register', { title: 'Register — EcoLoop' });
};

exports.postRegister = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone, address } = req.body;

    if (!name || !email || !password) {
      req.flash('error_msg', 'Please fill in all required fields.');
      return res.redirect('/register');
    }

    if (password !== confirmPassword) {
      req.flash('error_msg', 'Passwords do not match.');
      return res.redirect('/register');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      req.flash('error_msg', 'An account with this email already exists.');
      return res.redirect('/register');
    }

    const newUser = new User({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: 'citizen',
      phone: phone || '',
      address: address || ''
    });

    await newUser.save();

    req.session.user = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      address: newUser.address
    };

    req.flash('success_msg', 'Registration successful! Welcome to EcoLoop.');
    res.redirect('/citizen/dashboard');
  } catch (error) {
    console.error('Registration Error:', error);
    req.flash('error_msg', 'An error occurred during registration. Please try again.');
    res.redirect('/register');
  }
};

exports.getLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout Session Error:', err);
    res.redirect('/login');
  });
};
