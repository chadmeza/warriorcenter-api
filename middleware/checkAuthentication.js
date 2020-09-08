const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decodedToken = jwt.verify(token, process.env.JWT_TOKEN);

        // Add user data to the request
        req.userData = { email: decodedToken.email, userId: decodedToken.userId };
    next();
    } catch (error) {
        res.status(401).json({ error: "You must login to access this page." });
    }
};